import {GeneratorValidationError} from '../../lib/errors.ts';
import type {ExactCoefficientArithmetic, NumericalDataPosition, NumericalDataProblem, NumericalDataRecord,
    NumericalDataScalar, NumericalDataStudy, NumericalDataSummaryCore, NumericalDepartureCriterion,
    NumericalDepartureFacts, NumericalFrequency, NumericalMiddle, NumericalShapeFacts, SignedRationalAxis} from '../../types/problems.ts';
import {affineScalar} from '../algebra/algebra-affine-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {isSignedRationalAxis} from '../number/signed-rational-axis-helpers.ts';

export type NumericalDataBackbone = Omit<NumericalDataProblem, 'relations'>;
export type NumericalDataBackboneInput = Readonly<{
    study: NumericalDataStudy;
    records: NumericalDataProblem['records'];
    axes: Readonly<{value: SignedRationalAxis; count: SignedRationalAxis}>;
    histogramEdges: readonly [NumericalDataScalar, NumericalDataScalar, ...NumericalDataScalar[]];
    quartileConvention: 'median-of-halves-excluding-odd-center';
    whiskerConvention: 'observed-minimum-maximum';
    departureCriterion: NumericalDepartureCriterion | null;
}>;

const fail = (message: string): never => { throw new GeneratorValidationError('numerical-data', message); };
function validated<T>(build: () => T): T {
    try { return build(); }
    catch (error) {
        if (error instanceof GeneratorValidationError) throw error;
        return fail('Expected readable canonical source data and mathematical relations.');
    }
}
const object = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const fields = (value: unknown, names: readonly string[]): value is Record<string, unknown> => object(value)
    && names.every(name => Object.getOwnPropertyDescriptor(value, name)?.value !== undefined);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0;
const whole = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && !Object.is(value, -0);
function dense(value: unknown, minimum = 0): value is unknown[] {
    if (!Array.isArray(value) || value.length < minimum) return false;
    const indices = Object.getOwnPropertyNames(value).filter(key => String(Number(key)) === key
        && Number.isInteger(Number(key)) && Number(key) >= 0 && Number(key) < value.length);
    return indices.length === value.length && indices.every(key => Object.getOwnPropertyDescriptor(value, key)?.value !== undefined);
}
const scalar = (value: unknown): value is NumericalDataScalar => fields(value, ['numerator', 'denominator']) && isCanonicalSignedRational(value);
const copy = (value: NumericalDataScalar): NumericalDataScalar => ({numerator: value.numerator, denominator: value.denominator});
const num = (value: number): NumericalDataScalar => ({numerator: value, denominator: 1});
const same = (value: unknown, expected: NumericalDataScalar): value is NumericalDataScalar => scalar(value)
    && value.numerator === expected.numerator && value.denominator === expected.denominator;

/** Private fractions retain exact hidden sums, products and interval coordinates until a payload value is stored. */
type Wide = {n: bigint; d: bigint};
function fraction(n: bigint, d = 1n): Wide {
    if (d === 0n) return fail('A rational denominator cannot be zero.');
    if (d < 0n) { n = -n; d = -d; }
    let a = n < 0n ? -n : n, b = d;
    while (b) [a, b] = [b, a % b];
    return {n: n / a, d: d / a};
}
const wide = (value: NumericalDataScalar): Wide => ({n: BigInt(value.numerator), d: BigInt(value.denominator)});
const add = (a: Wide, b: Wide): Wide => fraction(a.n * b.d + b.n * a.d, a.d * b.d);
const subtract = (a: Wide, b: Wide): Wide => fraction(a.n * b.d - b.n * a.d, a.d * b.d);
const divide = (a: Wide, b: Wide): Wide => fraction(a.n * b.d, a.d * b.n);
const absolute = (a: Wide): Wide => ({n: a.n < 0n ? -a.n : a.n, d: a.d});
const compare = (a: Wide, b: Wide): -1 | 0 | 1 => a.n * b.d < b.n * a.d ? -1 : a.n * b.d > b.n * a.d ? 1 : 0;
const stored = (value: Wide): NumericalDataScalar => affineScalar(value.n, value.d);
const cmp = (a: NumericalDataScalar, b: NumericalDataScalar): -1 | 0 | 1 => compare(wide(a), wide(b));
const difference = (a: NumericalDataScalar, b: NumericalDataScalar): NumericalDataScalar => stored(subtract(wide(a), wide(b)));
const relation = (value: number): 'less' | 'equal' | 'greater' => value < 0 ? 'less' : value > 0 ? 'greater' : 'equal';
const key = (value: NumericalDataScalar): string => `${value.numerator}/${value.denominator}`;

function validRecords(value: unknown): value is NumericalDataRecord[] {
    if (!dense(value, 4)) return false;
    const ids = new Set<string>();
    return value.every(row => fields(row, ['id', 'unitId', 'occasionId', 'value']) && text(row.id) && text(row.unitId)
        && text(row.occasionId) && scalar(row.value) && !ids.has(row.id) && !!ids.add(row.id));
}

function middle(records: readonly NumericalDataRecord[]): NumericalMiddle {
    const count = records.length, first = Math.floor((count - 1) / 2), second = Math.floor(count / 2);
    const left = records[first]!, right = records[second]!;
    return {
        orderedRecordIds: [records[0]!.id, ...records.slice(1).map(row => row.id)],
        positions: first === second ? [first + 1] : [first + 1, second + 1],
        centralRecordIds: first === second ? [left.id] : [left.id, right.id],
        centralValues: first === second ? [copy(left.value)] : [copy(left.value), copy(right.value)],
        value: stored(divide(add(wide(left.value), wide(right.value)), fraction(2n)))
    };
}

function summarize(records: readonly NumericalDataRecord[]): NumericalDataSummaryCore {
    if (!validRecords(records)) return fail('At least four dense records with unique IDs and canonical values are required.');
    const ordered = records.map((row, index) => ({row, index})).sort((a, b) => cmp(a.row.value, b.row.value) || a.index - b.index).map(entry => entry.row);
    const sum = records.reduce((total, row) => add(total, wide(row.value)), fraction(0n));
    const mean = stored(divide(sum, fraction(BigInt(records.length))));
    const median = middle(ordered), half = Math.floor(ordered.length / 2);
    const lowerHalf = middle(ordered.slice(0, half)), upperHalf = middle(ordered.slice(Math.ceil(ordered.length / 2)));
    const deviations = records.map(row => {
        const signed = subtract(wide(row.value), wide(mean));
        return {recordId: row.id, value: copy(row.value), signedDifference: stored(signed), absoluteDifference: stored(absolute(signed))};
    });
    const absoluteDeviationSum = deviations.reduce((total, row) => add(total, wide(row.absoluteDifference)), fraction(0n));
    return {count: records.length, orderedRecordIds: [ordered[0]!.id, ...ordered.slice(1).map(row => row.id)],
        sum: stored(sum), minimum: copy(ordered[0]!.value), maximum: copy(ordered[ordered.length - 1]!.value), mean, median,
        quartiles: {convention: 'median-of-halves-excluding-odd-center', lowerHalf, upperHalf, q1: copy(lowerHalf.value), q3: copy(upperHalf.value)},
        iqr: difference(upperHalf.value, lowerHalf.value), deviations,
        absoluteDeviationSum: stored(absoluteDeviationSum), mad: stored(divide(absoluteDeviationSum, fraction(BigInt(records.length))))};
}

export function summarizeNumericalRecords(records: readonly NumericalDataRecord[]): NumericalDataSummaryCore {
    return validated(() => summarize(records));
}

function orderedIds(value: unknown, expected: readonly string[]): boolean {
    return dense(value) && value.length === expected.length && value.every((id, index) => id === expected[index]);
}
function idSet(value: unknown, expected: readonly string[]): value is string[] {
    return dense(value) && value.length === expected.length && value.every(text)
        && new Set(value).size === value.length && value.every(id => expected.includes(id));
}
function middleMatches(value: unknown, expected: NumericalMiddle): boolean {
    return fields(value, ['orderedRecordIds', 'positions', 'centralRecordIds', 'centralValues', 'value'])
        && orderedIds(value.orderedRecordIds, expected.orderedRecordIds) && dense(value.positions)
        && value.positions.length === expected.positions.length && value.positions.every((position, index) => whole(position) && position === expected.positions[index])
        && orderedIds(value.centralRecordIds, expected.centralRecordIds) && dense(value.centralValues)
        && value.centralValues.length === expected.centralValues.length && value.centralValues.every((entry, index) => same(entry, expected.centralValues[index]!))
        && same(value.value, expected.value);
}
export function isNumericalDataSummary(value: unknown, records: readonly NumericalDataRecord[]): value is NumericalDataSummaryCore {
    try {
        const expected = summarizeNumericalRecords(records);
        if (!fields(value, ['count', 'orderedRecordIds', 'sum', 'minimum', 'maximum', 'mean', 'median', 'quartiles', 'iqr', 'deviations', 'absoluteDeviationSum', 'mad'])
            || value.count !== expected.count || !orderedIds(value.orderedRecordIds, expected.orderedRecordIds)
            || !same(value.sum, expected.sum) || !same(value.minimum, expected.minimum) || !same(value.maximum, expected.maximum)
            || !same(value.mean, expected.mean) || !middleMatches(value.median, expected.median)
            || !fields(value.quartiles, ['convention', 'lowerHalf', 'upperHalf', 'q1', 'q3'])
            || value.quartiles.convention !== expected.quartiles.convention
            || !middleMatches(value.quartiles.lowerHalf, expected.quartiles.lowerHalf) || !middleMatches(value.quartiles.upperHalf, expected.quartiles.upperHalf)
            || !same(value.quartiles.q1, expected.quartiles.q1) || !same(value.quartiles.q3, expected.quartiles.q3)
            || !same(value.iqr, expected.iqr) || !same(value.absoluteDeviationSum, expected.absoluteDeviationSum) || !same(value.mad, expected.mad)
            || !dense(value.deviations) || value.deviations.length !== records.length) return false;
        return value.deviations.every((row, index) => {
            const wanted = expected.deviations[index]!;
            return fields(row, ['recordId', 'value', 'signedDifference', 'absoluteDifference']) && row.recordId === wanted.recordId
                && same(row.value, wanted.value) && same(row.signedDifference, wanted.signedDifference) && same(row.absoluteDifference, wanted.absoluteDifference);
        });
    } catch { return false; }
}

function attribute(value: unknown): value is NumericalDataStudy['attribute'] {
    if (!fields(value, ['id', 'name', 'kind', 'unit', 'method']) || !text(value.id) || !text(value.name)) return false;
    if (value.kind === 'count') return value.unit === 'items' && value.method === 'counted' && fields(value, ['countedObject']) && text(value.countedObject);
    if (!fields(value, ['precision']) || !scalar(value.precision) || value.precision.numerator <= 0) return false;
    return value.kind === 'length' && (value.unit === 'centimeters' || value.unit === 'meters') && value.method === 'ruler'
        || value.kind === 'duration' && (value.unit === 'seconds' || value.unit === 'minutes') && value.method === 'timer'
        || value.kind === 'temperature' && value.unit === 'degrees-celsius' && value.method === 'thermometer';
}
export function isNumericalDataRecordedValue(value: unknown, meaning: NumericalDataStudy['attribute']): value is NumericalDataScalar {
    try {
        if (!scalar(value) || !attribute(meaning) || (meaning.kind !== 'temperature' && value.numerator < 0)) return false;
        return meaning.kind === 'count' ? value.denominator === 1 : divide(wide(value), wide(meaning.precision)).d === 1n;
    } catch { return false; }
}
const registryEntry = (row: unknown): row is {id: string; name: string} => fields(row, ['id', 'name']) && text(row.id) && text(row.name);
function registry(value: unknown): value is {id: string; name: string}[] {
    return dense(value, 1) && value.every(registryEntry)
        && new Set(value.map(row => row.id)).size === value.length;
}
function studyMatches(value: unknown, records: readonly NumericalDataRecord[]): value is NumericalDataStudy {
    if (!fields(value, ['id', 'populationName', 'observationalUnitName', 'units', 'occasions', 'selection', 'attribute', 'goal'])
        || !text(value.id) || !text(value.populationName) || !text(value.observationalUnitName)
        || !registry(value.units) || !registry(value.occasions) || !attribute(value.attribute)
        || !fields(value.goal, ['kind']) || !['describe-recorded-collection', 'routine-member', 'equally-allocated-total'].includes(value.goal.kind as string)
        || value.goal.kind === 'equally-allocated-total' && value.attribute.kind === 'temperature') return false;
    const units = new Set(value.units.map(row => row.id)), occasions = new Set(value.occasions.map(row => row.id));
    const usedUnits = new Set<string>(), usedOccasions = new Set<string>(), pairs = new Set<string>();
    for (const row of records) {
        const pair = JSON.stringify([row.unitId, row.occasionId]);
        if (!units.has(row.unitId) || !occasions.has(row.occasionId) || pairs.has(pair) || !isNumericalDataRecordedValue(row.value, value.attribute)) return false;
        pairs.add(pair); usedUnits.add(row.unitId); usedOccasions.add(row.occasionId);
    }
    if (usedUnits.size !== units.size || usedOccasions.size !== occasions.size) return false;
    return value.selection === 'distinct-units' ? usedUnits.size === records.length
        : value.selection === 'repeated-occasions' && records.some(row => records.some(other => other.unitId === row.unitId && other.occasionId !== row.occasionId));
}
function axis(value: unknown): value is SignedRationalAxis {
    return fields(value, ['minimum', 'maximum', 'step', 'ticks', 'zeroIndex']) && scalar(value.minimum) && scalar(value.maximum)
        && scalar(value.step) && dense(value.ticks, 2) && value.ticks.every(scalar) && isSignedRationalAxis(value);
}
function position(value: NumericalDataScalar, scale: SignedRationalAxis): NumericalDataPosition {
    const coordinate = divide(subtract(wide(value), wide(scale.minimum)), wide(scale.step));
    if (compare(coordinate, fraction(0n)) < 0 || compare(coordinate, fraction(BigInt(scale.ticks.length - 1))) > 0) return fail('Every plotted quantity must fit its supplied complete scale.');
    return {value: copy(value), axisPosition: stored(coordinate)};
}
function positioned(value: unknown, expected: NumericalDataScalar, scale: SignedRationalAxis): boolean {
    return fields(value, ['value', 'axisPosition']) && same(value.value, expected) && same(value.axisPosition, position(expected, scale).axisPosition);
}
function frequencies(records: readonly NumericalDataRecord[]): [NumericalFrequency, ...NumericalFrequency[]] {
    const groups = new Map<string, {value: NumericalDataScalar; ids: string[]}>();
    records.forEach(row => { const id = key(row.value), old = groups.get(id); if (old) old.ids.push(row.id); else groups.set(id, {value: copy(row.value), ids: [row.id]}); });
    const result = [...groups.values()].sort((a, b) => cmp(a.value, b.value)).map((row, index): NumericalFrequency => ({id: `frequency-${index + 1}`, value: row.value, recordIds: [row.ids[0]!, ...row.ids.slice(1)], count: row.ids.length}));
    return [result[0]!, ...result.slice(1)];
}
function frequencyMatches(value: unknown, records: readonly NumericalDataRecord[]): value is NumericalFrequency[] {
    if (!dense(value, 1)) return false;
    const ids = new Set<string>(), supports = new Set<string>();
    let total = 0;
    for (const row of value) {
        if (!fields(row, ['id', 'value', 'recordIds', 'count']) || !text(row.id) || !scalar(row.value) || ids.has(row.id) || supports.has(key(row.value))) return false;
        const members = records.filter(record => cmp(record.value, row.value as NumericalDataScalar) === 0).map(record => record.id);
        if (members.length === 0 || !whole(row.count) || row.count !== members.length || !idSet(row.recordIds, members)) return false;
        ids.add(row.id); supports.add(key(row.value)); total += row.count;
    }
    return total === records.length;
}

function shapeFacts(classes: readonly NumericalFrequency[], summary: NumericalDataSummaryCore): NumericalShapeFacts {
    const ordered = [...classes].sort((a, b) => cmp(a.value, b.value));
    const midrange = stored(divide(add(wide(summary.minimum), wide(summary.maximum)), fraction(2n)));
    const maximumFrequency = classes.reduce((maximum, row) => Math.max(maximum, row.count), 0);
    const maxima = classes.filter(row => row.count === maximumFrequency).map(row => row.id);
    return {gaps: ordered.slice(1).map((row, index) => ({leftFrequencyId: ordered[index]!.id, rightFrequencyId: row.id, width: difference(row.value, ordered[index]!.value)})),
        maximumFrequency, maximumFrequencyIds: [maxima[0]!, ...maxima.slice(1)], midrange,
        reflections: classes.map(row => {
            const reflectedValue = stored(subtract(add(wide(summary.minimum), wide(summary.maximum)), wide(row.value)));
            const reflected = classes.find(other => cmp(other.value, reflectedValue) === 0);
            return {frequencyId: row.id, reflectedValue, reflectedFrequencyId: reflected?.id ?? null, count: row.count, reflectedCount: reflected?.count ?? 0};
        }), leftMedianExtent: difference(summary.median.value, summary.minimum), rightMedianExtent: difference(summary.maximum, summary.median.value)};
}
function shapeMatches(value: unknown, classes: readonly NumericalFrequency[], summary: NumericalDataSummaryCore): value is NumericalShapeFacts {
    if (!fields(value, ['gaps', 'maximumFrequency', 'maximumFrequencyIds', 'midrange', 'reflections', 'leftMedianExtent', 'rightMedianExtent'])) return false;
    const expected = shapeFacts(classes, summary);
    if (!whole(value.maximumFrequency) || value.maximumFrequency !== expected.maximumFrequency || !idSet(value.maximumFrequencyIds, expected.maximumFrequencyIds)
        || !same(value.midrange, expected.midrange) || !same(value.leftMedianExtent, expected.leftMedianExtent) || !same(value.rightMedianExtent, expected.rightMedianExtent)
        || !dense(value.gaps) || value.gaps.length !== expected.gaps.length || !dense(value.reflections) || value.reflections.length !== classes.length) return false;
    const gapIds = new Set<string>(), reflectionIds = new Set<string>();
    return value.gaps.every(row => {
        if (!fields(row, ['leftFrequencyId', 'rightFrequencyId', 'width']) || !text(row.leftFrequencyId) || gapIds.has(row.leftFrequencyId)) return false;
        const wanted = expected.gaps.find(other => other.leftFrequencyId === row.leftFrequencyId); gapIds.add(row.leftFrequencyId);
        return !!wanted && row.rightFrequencyId === wanted.rightFrequencyId && same(row.width, wanted.width);
    }) && value.reflections.every(row => {
        if (!fields(row, ['frequencyId', 'reflectedValue', 'reflectedFrequencyId', 'count', 'reflectedCount']) || !text(row.frequencyId) || reflectionIds.has(row.frequencyId)) return false;
        const wanted = expected.reflections.find(other => other.frequencyId === row.frequencyId); reflectionIds.add(row.frequencyId);
        return !!wanted && same(row.reflectedValue, wanted.reflectedValue) && row.reflectedFrequencyId === wanted.reflectedFrequencyId
            && whole(row.count) && row.count === wanted.count && whole(row.reflectedCount) && row.reflectedCount === wanted.reflectedCount;
    });
}

function criterion(value: unknown): value is NumericalDepartureCriterion {
    return fields(value, ['kind', 'lower', 'upper', 'minimumSeparation', 'referenceSource']) && value.kind === 'separated-from-routine-majority'
        && scalar(value.lower) && scalar(value.upper) && cmp(value.lower, value.upper) <= 0 && scalar(value.minimumSeparation) && value.minimumSeparation.numerator > 0
        && (value.referenceSource === 'routine-operation-reference' || value.referenceSource === 'study-reference-range');
}
function departure(records: readonly NumericalDataRecord[], rule: NumericalDepartureCriterion): NumericalDepartureFacts {
    const ordinary = records.filter(row => cmp(row.value, rule.lower) >= 0 && cmp(row.value, rule.upper) <= 0);
    if (ordinary.length * 2 <= records.length) return fail('A departure reference needs a strict in-band majority.');
    const separations = records.filter(row => !ordinary.includes(row)).map(row => {
        const nearest = ordinary.reduce((best, other) => compare(absolute(subtract(wide(other.value), wide(row.value))), absolute(subtract(wide(best.value), wide(row.value)))) < 0 ? other : best);
        const signed = difference(row.value, nearest.value), absoluteDifference = stored(absolute(wide(signed)));
        return {recordId: row.id, nearestOrdinaryRecordId: nearest.id,
            subtraction: {kind: 'binary', operation: 'subtraction', operands: [copy(row.value), copy(nearest.value)], result: signed} as ExactCoefficientArithmetic,
            absoluteDifference, thresholdRelation: relation(cmp(absoluteDifference, rule.minimumSeparation))};
    });
    return {criterion: {...rule, lower: copy(rule.lower), upper: copy(rule.upper), minimumSeparation: copy(rule.minimumSeparation)},
        comparisons: records.map(row => ({recordId: row.id, lowerRelation: relation(cmp(row.value, rule.lower)), upperRelation: relation(cmp(row.value, rule.upper)), outside: !ordinary.includes(row)})),
        ordinaryRecordIds: [ordinary[0]!.id, ...ordinary.slice(1).map(row => row.id)], separations,
        exceptionalRecordIds: separations.filter(row => row.thresholdRelation !== 'less').map(row => row.recordId)};
}
function subtractionMatches(value: unknown, first: NumericalDataScalar, second: NumericalDataScalar): boolean {
    if (!fields(value, ['kind', 'operation', 'operands', 'result']) || value.kind !== 'binary' || value.operation !== 'subtraction'
        || !dense(value.operands) || value.operands.length !== 2 || !scalar(value.operands[0]) || !scalar(value.operands[1])) return false;
    const [left, right] = value.operands;
    return ((same(left, first) && same(right, second)) || (same(left, second) && same(right, first))) && same(value.result, difference(left, right));
}
function departureMatches(value: unknown, records: readonly NumericalDataRecord[]): value is NumericalDepartureFacts {
    if (!fields(value, ['criterion', 'comparisons', 'ordinaryRecordIds', 'separations', 'exceptionalRecordIds']) || !criterion(value.criterion)) return false;
    const expected = departure(records, value.criterion), rule = value.criterion;
    if (!idSet(value.ordinaryRecordIds, expected.ordinaryRecordIds) || !idSet(value.exceptionalRecordIds, expected.exceptionalRecordIds)
        || !dense(value.comparisons) || value.comparisons.length !== records.length || !dense(value.separations) || value.separations.length !== expected.separations.length) return false;
    const seen = new Set<string>(), separated = new Set<string>();
    return value.comparisons.every(row => {
        if (!fields(row, ['recordId', 'lowerRelation', 'upperRelation', 'outside']) || !text(row.recordId) || seen.has(row.recordId)) return false;
        const wanted = expected.comparisons.find(other => other.recordId === row.recordId); seen.add(row.recordId);
        return !!wanted && row.lowerRelation === wanted.lowerRelation && row.upperRelation === wanted.upperRelation && row.outside === wanted.outside;
    }) && value.separations.every(row => {
        if (!fields(row, ['recordId', 'nearestOrdinaryRecordId', 'subtraction', 'absoluteDifference', 'thresholdRelation']) || !text(row.recordId) || separated.has(row.recordId)) return false;
        const wanted = expected.separations.find(other => other.recordId === row.recordId), source = records.find(record => record.id === row.recordId);
        const nearest = records.find(record => record.id === row.nearestOrdinaryRecordId && expected.ordinaryRecordIds.includes(record.id)); separated.add(row.recordId);
        return !!wanted && !!source && !!nearest && same(row.absoluteDifference, wanted.absoluteDifference)
            && cmp(stored(absolute(subtract(wide(source.value), wide(nearest.value)))), wanted.absoluteDifference) === 0
            && subtractionMatches(row.subtraction, source.value, nearest.value) && row.thresholdRelation === relation(cmp(wanted.absoluteDifference, rule.minimumSeparation));
    });
}

function histogramMember(value: NumericalDataScalar, lower: NumericalDataScalar, upper: NumericalDataScalar, last: boolean): boolean {
    return cmp(value, lower) >= 0 && (cmp(value, upper) < 0 || last && cmp(value, upper) === 0);
}
function plotsMatches(value: unknown, records: readonly NumericalDataRecord[], classes: readonly NumericalFrequency[], summary: NumericalDataSummaryCore): value is NumericalDataProblem['plots'] {
    if (!fields(value, ['valueAxis', 'countAxis', 'dots', 'histogram', 'box']) || !axis(value.valueAxis) || !axis(value.countAxis)
        || value.countAxis.minimum.numerator !== 0 || value.countAxis.zeroIndex !== 0 || !dense(value.dots) || value.dots.length !== records.length
        || !fields(value.histogram, ['convention', 'width', 'bins']) || value.histogram.convention !== 'equal-width-left-closed-right-open-final-right-closed'
        || !scalar(value.histogram.width) || value.histogram.width.numerator <= 0 || !dense(value.histogram.bins, 1)) return false;
    const valueAxis = value.valueAxis, countAxis = value.countAxis, seen = new Set<string>(), stacks = new Set<string>();
    if (!value.dots.every(row => {
        if (!fields(row, ['recordId', 'frequencyId', 'valueLocation', 'stackOrdinal', 'stackLocation']) || !text(row.recordId) || seen.has(row.recordId)
            || !whole(row.stackOrdinal) || row.stackOrdinal === 0) return false;
        const source = records.find(record => record.id === row.recordId), frequency = classes.find(other => other.id === row.frequencyId);
        const stack = JSON.stringify([row.frequencyId, row.stackOrdinal]);
        if (!source || !frequency || !frequency.recordIds.includes(source.id) || row.stackOrdinal > frequency.count || stacks.has(stack)) return false;
        seen.add(row.recordId); stacks.add(stack);
        return positioned(row.valueLocation, source.value, valueAxis) && positioned(row.stackLocation, num(row.stackOrdinal), countAxis);
    })) return false;
    const bins = value.histogram.bins, width = value.histogram.width, binIds = new Set<string>(), allMembers: string[] = [];
    for (let index = 0; index < bins.length; index++) {
        const bin = bins[index], last = index === bins.length - 1;
        if (!fields(bin, ['id', 'lower', 'upper', 'lowerClosed', 'upperClosed', 'recordIds', 'count', 'left', 'right', 'top']) || !text(bin.id) || binIds.has(bin.id)
            || !scalar(bin.lower) || !scalar(bin.upper) || !same(difference(bin.upper, bin.lower), width)
            || bin.lowerClosed !== true || bin.upperClosed !== last || !whole(bin.count)) return false;
        const previous = bins[index - 1];
        if (index > 0 && (!fields(previous, ['upper']) || !same(bin.lower, previous.upper as NumericalDataScalar))) return false;
        const wanted = records.filter(row => histogramMember(row.value, bin.lower as NumericalDataScalar, bin.upper as NumericalDataScalar, last)).map(row => row.id);
        if (!idSet(bin.recordIds, wanted) || bin.count !== wanted.length || !positioned(bin.left, bin.lower, valueAxis)
            || !positioned(bin.right, bin.upper, valueAxis) || !positioned(bin.top, num(bin.count), countAxis)) return false;
        binIds.add(bin.id); for (const id of wanted) allMembers.push(id);
    }
    if (!idSet(allMembers, records.map(row => row.id)) || !fields(value.box, ['quartileConvention', 'whiskerConvention', 'minimum', 'q1', 'median', 'q3', 'maximum'])
        || value.box.quartileConvention !== 'median-of-halves-excluding-odd-center' || value.box.whiskerConvention !== 'observed-minimum-maximum') return false;
    return positioned(value.box.minimum, summary.minimum, valueAxis) && positioned(value.box.q1, summary.quartiles.q1, valueAxis)
        && positioned(value.box.median, summary.median.value, valueAxis) && positioned(value.box.q3, summary.quartiles.q3, valueAxis) && positioned(value.box.maximum, summary.maximum, valueAxis);
}

export function isNumericalDataBackbone(value: unknown): value is NumericalDataBackbone {
    try {
        return fields(value, ['kind', 'study', 'records', 'summary', 'frequencies', 'plots', 'shapeFacts', 'departureFacts']) && value.kind === 'numerical-data'
            && validRecords(value.records) && studyMatches(value.study, value.records) && isNumericalDataSummary(value.summary, value.records)
            && frequencyMatches(value.frequencies, value.records) && plotsMatches(value.plots, value.records, value.frequencies, value.summary)
            && shapeMatches(value.shapeFacts, value.frequencies, value.summary) && (value.departureFacts === null || departureMatches(value.departureFacts, value.records));
    } catch { return false; }
}

function buildBackbone(input: NumericalDataBackboneInput): NumericalDataBackbone {
    if (!fields(input, ['study', 'records', 'axes', 'histogramEdges', 'quartileConvention', 'whiskerConvention', 'departureCriterion'])
        || !validRecords(input.records) || !studyMatches(input.study, input.records) || !fields(input.axes, ['value', 'count'])
        || !axis(input.axes.value) || !axis(input.axes.count) || input.axes.count.minimum.numerator !== 0 || input.axes.count.zeroIndex !== 0
        || !dense(input.histogramEdges, 2) || !input.histogramEdges.every(scalar)
        || input.quartileConvention !== 'median-of-halves-excluding-odd-center' || input.whiskerConvention !== 'observed-minimum-maximum'
        || input.departureCriterion !== null && !criterion(input.departureCriterion)) return fail('Expected coherent study, records, conventions and complete plotting scales.');
    const width = difference(input.histogramEdges[1], input.histogramEdges[0]);
    if (width.numerator <= 0 || !input.histogramEdges.slice(1).every((edge, index) => same(difference(edge, input.histogramEdges[index]!), width))) return fail('Histogram edges must increase with one positive exact width.');
    const records = input.records.map(row => ({...row, value: copy(row.value)}));
    const summary = summarizeNumericalRecords(records), classes = frequencies(records);
    const dots = classes.flatMap(row => row.recordIds.map((recordId, index) => ({recordId, frequencyId: row.id,
        valueLocation: position(row.value, input.axes.value), stackOrdinal: index + 1, stackLocation: position(num(index + 1), input.axes.count)})));
    const bins = input.histogramEdges.slice(1).map((upper, index) => {
        const lower = input.histogramEdges[index]!, last = index === input.histogramEdges.length - 2;
        const members = records.filter(row => histogramMember(row.value, lower, upper, last)).map(row => row.id);
        return {id: `bin-${index + 1}`, lower: copy(lower), upper: copy(upper), lowerClosed: true as const, upperClosed: last, recordIds: members,
            count: members.length, left: position(lower, input.axes.value), right: position(upper, input.axes.value), top: position(num(members.length), input.axes.count)};
    });
    const valueAxis = input.axes.value, countAxis = input.axes.count;
    const cloneAxis = (source: SignedRationalAxis): SignedRationalAxis => ({minimum: copy(source.minimum), maximum: copy(source.maximum), step: copy(source.step), ticks: source.ticks.map(copy), zeroIndex: source.zeroIndex});
    const result: NumericalDataBackbone = {kind: 'numerical-data', study: structuredClone(input.study), records: [records[0]!, records[1]!, records[2]!, records[3]!, ...records.slice(4)],
        summary, frequencies: classes, plots: {valueAxis: cloneAxis(valueAxis), countAxis: cloneAxis(countAxis), dots,
            histogram: {convention: 'equal-width-left-closed-right-open-final-right-closed', width, bins: [bins[0]!, ...bins.slice(1)]},
            box: {quartileConvention: input.quartileConvention, whiskerConvention: input.whiskerConvention,
                minimum: position(summary.minimum, valueAxis), q1: position(summary.quartiles.q1, valueAxis), median: position(summary.median.value, valueAxis),
                q3: position(summary.quartiles.q3, valueAxis), maximum: position(summary.maximum, valueAxis)}},
        shapeFacts: shapeFacts(classes, summary), departureFacts: input.departureCriterion === null ? null : departure(records, input.departureCriterion)};
    if (!isNumericalDataBackbone(result)) return fail('The complete numerical-data relations are not coherent.');
    return result;
}

export function buildNumericalDataBackbone(input: NumericalDataBackboneInput): NumericalDataBackbone {
    return validated(() => buildBackbone(input));
}
