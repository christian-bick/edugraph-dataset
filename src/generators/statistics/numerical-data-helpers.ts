import {GeneratorValidationError} from '../../lib/errors.ts';
import type {ExactCoefficientArithmetic, NumericalDataProblem, NumericalDataRecord, NumericalDataRelation,
    NumericalDataScalar, NumericalDataSummaryCore, NumericalDepartureFacts, NumericalIqrProof, NumericalMadProof,
    NumericalMeanProof, NumericalMedianProof, NumericalMiddle, NumericalMiddleProof, NumericalQuartileProof,
    NumericalSensitivityProof} from '../../types/problems.ts';
import {affineCoefficientArithmetic, compareAffineScalars, equalAffineScalars,
    negateAffineScalar} from '../algebra/algebra-affine-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {buildNumericalDataBackbone, isNumericalDataBackbone, isNumericalDataRecordedValue,
    isNumericalDataSummary, summarizeNumericalRecords,
    type NumericalDataBackbone, type NumericalDataBackboneInput} from './numerical-data-core-helpers.ts';

export type NumericalDataBuildInput = NumericalDataBackboneInput & Readonly<{
    relations: readonly [NumericalDataRelation['kind'], ...NumericalDataRelation['kind'][]];
    replacement?: Readonly<{recordId: string; value: NumericalDataScalar; referenceSource: 'documented-routine-value'}>;
}>;

const kinds: readonly NumericalDataRelation['kind'][] = ['arithmetic-mean', 'median', 'quartiles',
    'mean-absolute-deviation', 'interquartile-range', 'frequency-partition', 'sample-cardinality',
    'variable-recording', 'empirical-shape', 'observed-variability', 'criterion-backed-departure', 'single-record-replacement'];
const fail = (message: string): never => { throw new GeneratorValidationError('numerical-data', message); };
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
/** Stop at the first hole; never expand an unknown nominal array length. */
function dense(value: unknown, length?: number): value is unknown[] {
    if (!Array.isArray(value) || (length !== undefined && value.length !== length)) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
}
const same = (value: unknown, expected: NumericalDataScalar): boolean => isCanonicalSignedRational(value)
    && equalAffineScalars(value, expected);
const whole = (value: unknown, expected: number): boolean => typeof value === 'number'
    && Number.isSafeInteger(value) && !Object.is(value, -0) && value === expected;
const equalList = (value: unknown, expected: readonly unknown[]): boolean => dense(value, expected.length)
    && value.every((entry, index) => entry === expected[index]);
const idSet = (value: unknown, expected: readonly string[]): boolean => dense(value, expected.length)
    && new Set(value).size === expected.length && value.every(entry => typeof entry === 'string' && expected.includes(entry));
const abs = (value: NumericalDataScalar): NumericalDataScalar => value.numerator < 0 ? negateAffineScalar(value) : value;
const number = (value: number): NumericalDataScalar => ({numerator: value, denominator: 1});
const relation = (first: NumericalDataScalar, second: NumericalDataScalar): 'less' | 'equal' | 'greater' => {
    const order = compareAffineScalars(first, second);
    return order < 0 ? 'less' : order > 0 ? 'greater' : 'equal';
};

function work(value: unknown, operation: ExactCoefficientArithmetic['operation'], first: NumericalDataScalar,
    second: NumericalDataScalar, result: NumericalDataScalar): boolean {
    return record(value) && value.kind === 'binary' && value.operation === operation && dense(value.operands, 2)
        && same(value.operands[0], first) && same(value.operands[1], second) && same(value.result, result);
}

function middle(value: unknown, expected: NumericalMiddle): boolean {
    return record(value) && equalList(value.orderedRecordIds, expected.orderedRecordIds)
        && equalList(value.positions, expected.positions) && equalList(value.centralRecordIds, expected.centralRecordIds)
        && dense(value.centralValues, expected.centralValues.length)
        && value.centralValues.every((entry, index) => same(entry, expected.centralValues[index]!)) && same(value.value, expected.value);
}
function middleProof(value: unknown, expected: NumericalMiddle): boolean {
    if (!record(value) || !middle(value.middle, expected) || !record(value.arithmetic)) return false;
    const arithmetic = value.arithmetic;
    if (expected.centralValues.length === 1) return arithmetic.kind === 'single-central-value'
        && arithmetic.recordId === expected.centralRecordIds[0] && same(arithmetic.value, expected.value);
    const [first, second] = expected.centralValues;
    return arithmetic.kind === 'central-pair-average' && whole(arithmetic.divisor, 2) && same(arithmetic.result, expected.value)
        && dense(arithmetic.operands, 2) && ((same(arithmetic.operands[0], first) && same(arithmetic.operands[1], second))
            || (same(arithmetic.operands[1], first) && same(arithmetic.operands[0], second)));
}
function makeMiddleProof(value: NumericalMiddle): NumericalMiddleProof {
    return {middle: value, arithmetic: value.centralValues.length === 1
        ? {kind: 'single-central-value', recordId: value.centralRecordIds[0], value: value.value}
        : {kind: 'central-pair-average', operands: [value.centralValues[0], value.centralValues[1]], divisor: 2, result: value.value}};
}
const makeMean = (records: readonly NumericalDataRecord[], summary: NumericalDataSummaryCore): NumericalMeanProof => ({
    kind: 'arithmetic-mean', recordIds: [records[0]!.id, ...records.slice(1).map(row => row.id)], sum: summary.sum,
    quotient: affineCoefficientArithmetic('division', summary.sum, number(summary.count))
});
const makeMedian = (summary: NumericalDataSummaryCore): NumericalMedianProof => ({kind: 'median', positional: makeMiddleProof(summary.median)});
const makeQuartiles = (summary: NumericalDataSummaryCore): NumericalQuartileProof => ({
    kind: 'quartiles', convention: summary.quartiles.convention,
    lowerHalf: makeMiddleProof(summary.quartiles.lowerHalf), upperHalf: makeMiddleProof(summary.quartiles.upperHalf)
});
const makeMad = (records: readonly NumericalDataRecord[], summary: NumericalDataSummaryCore): NumericalMadProof => ({
    kind: 'mean-absolute-deviation', center: summary.mean, deviations: summary.deviations.map((row, index) => ({
        recordId: row.recordId, subtraction: affineCoefficientArithmetic('subtraction', records[index]!.value, summary.mean),
        signedDifference: row.signedDifference, absoluteDifference: row.absoluteDifference
    })), absoluteDeviationSum: summary.absoluteDeviationSum,
    quotient: affineCoefficientArithmetic('division', summary.absoluteDeviationSum, number(summary.count))
});
const makeIqr = (summary: NumericalDataSummaryCore): NumericalIqrProof => ({kind: 'interquartile-range',
    quartiles: makeQuartiles(summary), subtraction: affineCoefficientArithmetic('subtraction', summary.quartiles.q3, summary.quartiles.q1)});

function quartileProof(value: unknown, summary: NumericalDataSummaryCore): boolean {
    return record(value) && value.kind === 'quartiles' && value.convention === summary.quartiles.convention
        && middleProof(value.lowerHalf, summary.quartiles.lowerHalf) && middleProof(value.upperHalf, summary.quartiles.upperHalf);
}
function summaryProof(value: unknown, records: readonly NumericalDataRecord[], summary: NumericalDataSummaryCore): boolean {
    if (!record(value)) return false;
    switch (value.kind) {
        case 'arithmetic-mean': return idSet(value.recordIds, records.map(row => row.id)) && same(value.sum, summary.sum)
            && work(value.quotient, 'division', summary.sum, number(summary.count), summary.mean);
        case 'median': return middleProof(value.positional, summary.median);
        case 'quartiles': return quartileProof(value, summary);
        case 'interquartile-range': return quartileProof(value.quartiles, summary)
            && work(value.subtraction, 'subtraction', summary.quartiles.q3, summary.quartiles.q1, summary.iqr);
        case 'mean-absolute-deviation': {
            if (!same(value.center, summary.mean) || !same(value.absoluteDeviationSum, summary.absoluteDeviationSum)
                || !work(value.quotient, 'division', summary.absoluteDeviationSum, number(summary.count), summary.mad)
                || !dense(value.deviations, records.length)) return false;
            const seen = new Set<string>();
            return value.deviations.every(row => {
                if (!record(row) || typeof row.recordId !== 'string' || seen.has(row.recordId)) return false;
                seen.add(row.recordId);
                const index = records.findIndex(item => item.id === row.recordId);
                const expected = summary.deviations[index];
                return expected !== undefined && work(row.subtraction, 'subtraction', records[index]!.value, summary.mean, expected.signedDifference)
                    && same(row.signedDifference, expected.signedDifference) && same(row.absoluteDifference, expected.absoluteDifference);
            });
        }
        default: return false;
    }
}

/** Compare two distances without materializing an otherwise unstored wide difference. */
function distanceOrder(origin: NumericalDataScalar, first: NumericalDataScalar, second: NumericalDataScalar): number {
    const difference = (other: NumericalDataScalar): readonly [bigint, bigint] => {
        const n = BigInt(origin.numerator) * BigInt(other.denominator) - BigInt(other.numerator) * BigInt(origin.denominator);
        return [n < 0n ? -n : n, BigInt(origin.denominator) * BigInt(other.denominator)];
    };
    const [a, b] = difference(first), [c, d] = difference(second), order = a * d - c * b;
    return order < 0n ? -1 : order > 0n ? 1 : 0;
}
function departureProof(value: unknown, backbone: NumericalDataBackbone): value is NumericalDepartureFacts {
    const expected = backbone.departureFacts;
    if (!expected || !record(value) || !record(value.criterion)) return false;
    const criterion = value.criterion;
    if (criterion.kind !== expected.criterion.kind || criterion.referenceSource !== expected.criterion.referenceSource
        || !same(criterion.lower, expected.criterion.lower) || !same(criterion.upper, expected.criterion.upper)
        || !same(criterion.minimumSeparation, expected.criterion.minimumSeparation)
        || !idSet(value.ordinaryRecordIds, expected.ordinaryRecordIds) || !idSet(value.exceptionalRecordIds, expected.exceptionalRecordIds)
        || !dense(value.comparisons, expected.comparisons.length) || !dense(value.separations, expected.separations.length)) return false;
    const comparisons = new Set<string>(), separations = new Set<string>();
    if (!value.comparisons.every(row => {
        if (!record(row) || typeof row.recordId !== 'string' || comparisons.has(row.recordId)) return false;
        comparisons.add(row.recordId);
        const source = expected.comparisons.find(item => item.recordId === row.recordId);
        return source && row.lowerRelation === source.lowerRelation && row.upperRelation === source.upperRelation && row.outside === source.outside;
    })) return false;
    return value.separations.every(row => {
        if (!record(row) || typeof row.recordId !== 'string' || separations.has(row.recordId)) return false;
        separations.add(row.recordId);
        const source = backbone.records.find(item => item.id === row.recordId);
        const ordinary = backbone.records.find(item => item.id === row.nearestOrdinaryRecordId);
        const sourceFact = expected.separations.find(item => item.recordId === row.recordId);
        if (!source || !ordinary || !sourceFact || !expected.ordinaryRecordIds.includes(ordinary.id)
            || expected.ordinaryRecordIds.some(id => distanceOrder(source.value, ordinary.value, backbone.records.find(item => item.id === id)!.value) > 0)
            || !same(row.absoluteDifference, sourceFact.absoluteDifference) || row.thresholdRelation !== sourceFact.thresholdRelation) return false;
        const direct = affineCoefficientArithmetic('subtraction', source.value, ordinary.value);
        return work(row.subtraction, 'subtraction', source.value, ordinary.value, direct.result)
            || work(row.subtraction, 'subtraction', ordinary.value, source.value, negateAffineScalar(direct.result));
    });
}

function sensitivity(value: unknown, backbone: NumericalDataBackbone): boolean {
    if (!record(value) || value.referenceSource !== 'documented-routine-value' || typeof value.recordId !== 'string') return false;
    const original = backbone.records.find(row => row.id === value.recordId);
    if (!original || !same(value.originalValue, original.value) || !isNumericalDataRecordedValue(value.replacementValue, backbone.study.attribute)
        || same(value.replacementValue, original.value)) return false;
    const replacement = value.replacementValue;
    const records = backbone.records.map(row => row.id === original.id ? {...row, value: replacement} : row);
    if (!isNumericalDataSummary(value.modified, records) || !dense(value.modifiedProofs, 4) || !dense(value.changes, 4)) return false;
    const modified = value.modified, proofKinds = ['arithmetic-mean', 'median', 'mean-absolute-deviation', 'interquartile-range'];
    if (!value.modifiedProofs.every((proof, index) => record(proof) && proof.kind === proofKinds[index] && summaryProof(proof, records, modified))) return false;
    const measures = ['mean', 'median', 'mad', 'iqr'] as const;
    const measureValue = (summary: NumericalDataSummaryCore, measure: typeof measures[number]) => measure === 'median' ? summary.median.value : summary[measure];
    const changes = measures.map(measure => affineCoefficientArithmetic('subtraction', measureValue(modified, measure), measureValue(backbone.summary, measure)));
    return value.changes.every((row, index) => record(row) && row.measure === measures[index]
        && work(row.difference, 'subtraction', changes[index]!.operands[0], changes[index]!.operands[1], changes[index]!.result)
        && same(row.absoluteDifference, abs(changes[index]!.result)))
        && value.centerChangeRelation === relation(abs(changes[0]!.result), abs(changes[1]!.result))
        && value.spreadChangeRelation === relation(abs(changes[2]!.result), abs(changes[3]!.result));
}

function selectedProof(value: unknown, backbone: NumericalDataBackbone): boolean {
    if (!record(value)) return false;
    if (['arithmetic-mean', 'median', 'quartiles', 'mean-absolute-deviation', 'interquartile-range'].includes(String(value.kind))) {
        return summaryProof(value, backbone.records, backbone.summary);
    }
    switch (value.kind) {
        case 'frequency-partition': {
            if (!dense(value.classes, backbone.frequencies.length) || !dense(value.histogramMemberships, backbone.plots.histogram.bins.length)
                || !whole(value.totalCount, backbone.records.length)) return false;
            const seen = new Set<string>(), bins = new Set<string>();
            return value.classes.every(row => {
                if (!record(row) || typeof row.frequencyId !== 'string' || seen.has(row.frequencyId)) return false;
                seen.add(row.frequencyId);
                const source = backbone.frequencies.find(item => item.id === row.frequencyId);
                return source && whole(row.count, source.count) && idSet(row.recordIds, source.recordIds);
            }) && value.histogramMemberships.every(row => {
                if (!record(row) || typeof row.binId !== 'string' || bins.has(row.binId)) return false;
                bins.add(row.binId);
                const source = backbone.plots.histogram.bins.find(item => item.id === row.binId);
                return source && whole(row.count, source.count) && idSet(row.recordIds, source.recordIds);
            });
        }
        case 'sample-cardinality': {
            if (!whole(value.count, backbone.records.length) || !dense(value.enumeration, backbone.records.length)) return false;
            const ids = new Set<string>(), ordinals = new Set<number>();
            return value.enumeration.every(row => {
                if (!record(row) || typeof row.recordId !== 'string' || ids.has(row.recordId) || !backbone.records.some(item => item.id === row.recordId)
                    || typeof row.ordinal !== 'number' || !Number.isSafeInteger(row.ordinal) || row.ordinal < 1 || row.ordinal > backbone.records.length || ordinals.has(row.ordinal)) return false;
                ids.add(row.recordId); ordinals.add(row.ordinal); return true;
            });
        }
        case 'variable-recording': {
            if (value.attributeId !== backbone.study.attribute.id || !dense(value.incidences, backbone.records.length)) return false;
            const seen = new Set<string>();
            return value.incidences.every(row => {
                if (!record(row) || typeof row.recordId !== 'string' || seen.has(row.recordId)) return false;
                seen.add(row.recordId);
                const source = backbone.records.find(item => item.id === row.recordId);
                return source && row.unitId === source.unitId && row.occasionId === source.occasionId
                    && row.attributeId === backbone.study.attribute.id && row.method === backbone.study.attribute.method && same(row.value, source.value);
            });
        }
        case 'empirical-shape': {
            const facts = backbone.shapeFacts;
            if (!idSet(value.maximumFrequencyIds, facts.maximumFrequencyIds) || !record(value.medianTailComparison)
                || !same(value.medianTailComparison.left, facts.leftMedianExtent) || !same(value.medianTailComparison.right, facts.rightMedianExtent)
                || value.medianTailComparison.relation !== relation(facts.leftMedianExtent, facts.rightMedianExtent)
                || !dense(value.gaps, facts.gaps.length) || !record(value.symmetry) || !same(value.symmetry.center, facts.midrange)) return false;
            const seen = new Set<string>();
            if (!value.gaps.every(row => {
                if (!record(row) || typeof row.leftFrequencyId !== 'string' || seen.has(row.leftFrequencyId)) return false;
                seen.add(row.leftFrequencyId);
                const source = facts.gaps.find(item => item.leftFrequencyId === row.leftFrequencyId);
                return source && row.rightFrequencyId === source.rightFrequencyId && same(row.width, source.width);
            })) return false;
            const symmetry = value.symmetry;
            if (symmetry.kind === 'reflection-inequality') {
                const source = facts.reflections.find(row => row.frequencyId === symmetry.frequencyId);
                return source !== undefined && source.count !== source.reflectedCount && same(symmetry.reflectedValue, source.reflectedValue)
                    && symmetry.reflectedFrequencyId === source.reflectedFrequencyId && whole(symmetry.firstCount, source.count) && whole(symmetry.secondCount, source.reflectedCount);
            }
            if (symmetry.kind !== 'reflection-equality' || !dense(symmetry.pairs, facts.reflections.length)) return false;
            const frequencies = new Set<string>();
            return symmetry.pairs.every(row => {
                if (!record(row) || typeof row.frequencyId !== 'string' || frequencies.has(row.frequencyId)) return false;
                frequencies.add(row.frequencyId);
                const source = facts.reflections.find(item => item.frequencyId === row.frequencyId);
                return source && source.reflectedFrequencyId !== null && source.count === source.reflectedCount
                    && row.reflectedFrequencyId === source.reflectedFrequencyId && whole(row.commonCount, source.count);
            });
        }
        case 'observed-variability': {
            if (!dense(value.orderedRecordIds, 2)) return false;
            const ids = value.orderedRecordIds;
            const lower = backbone.records.find(row => row.id === ids[0]);
            const upper = backbone.records.find(row => row.id === ids[1]);
            if (!lower || !upper || compareAffineScalars(lower.value, upper.value) >= 0 || !same(value.lower, lower.value) || !same(value.upper, upper.value)) return false;
            const difference = affineCoefficientArithmetic('subtraction', upper.value, lower.value);
            return work(value.positiveDifference, 'subtraction', upper.value, lower.value, difference.result);
        }
        case 'criterion-backed-departure': return departureProof(value.facts, backbone) && value.facts.exceptionalRecordIds.length > 0
            && idSet(value.exceptionalRecordIds, value.facts.exceptionalRecordIds);
        case 'single-record-replacement': return sensitivity(value, backbone);
        default: return false;
    }
}

function makeSensitivity(backbone: NumericalDataBackbone, replacement: NonNullable<NumericalDataBuildInput['replacement']>): NumericalSensitivityProof {
    const original = backbone.records.find(row => row.id === replacement.recordId);
    if (!original || replacement.referenceSource !== 'documented-routine-value'
        || !isNumericalDataRecordedValue(replacement.value, backbone.study.attribute) || equalAffineScalars(replacement.value, original.value)) {
        return fail('A replacement must change one actual record on the original attribute domain and precision grid.');
    }
    const records = backbone.records.map(row => row.id === original.id ? {...row, value: replacement.value} : row);
    const modified = summarizeNumericalRecords(records);
    const change = (measure: 'mean' | 'median' | 'mad' | 'iqr') => {
        const before = measure === 'median' ? backbone.summary.median.value : backbone.summary[measure];
        const after = measure === 'median' ? modified.median.value : modified[measure];
        const difference = affineCoefficientArithmetic('subtraction', after, before);
        return {measure, difference, absoluteDifference: abs(difference.result)};
    };
    const mean = change('mean'), median = change('median'), mad = change('mad'), iqr = change('iqr');
    return {kind: 'single-record-replacement', recordId: original.id, originalValue: original.value, replacementValue: replacement.value,
        referenceSource: replacement.referenceSource, modified,
        modifiedProofs: [makeMean(records, modified), makeMedian(modified), makeMad(records, modified), makeIqr(modified)],
        changes: [{...mean, measure: 'mean'}, {...median, measure: 'median'}, {...mad, measure: 'mad'}, {...iqr, measure: 'iqr'}],
        centerChangeRelation: relation(mean.absoluteDifference, median.absoluteDifference), spreadChangeRelation: relation(mad.absoluteDifference, iqr.absoluteDifference)};
}

function makeProof(kind: NumericalDataRelation['kind'], backbone: NumericalDataBackbone,
    replacement: NumericalDataBuildInput['replacement']): NumericalDataRelation {
    const {records, summary} = backbone;
    switch (kind) {
        case 'arithmetic-mean': return makeMean(records, summary);
        case 'median': return makeMedian(summary);
        case 'quartiles': return makeQuartiles(summary);
        case 'mean-absolute-deviation': return makeMad(records, summary);
        case 'interquartile-range': return makeIqr(summary);
        case 'frequency-partition': {
            const classRow = (row: NumericalDataBackbone['frequencies'][number]) => ({frequencyId: row.id, recordIds: row.recordIds, count: row.count});
            return {kind, classes: [classRow(backbone.frequencies[0]), ...backbone.frequencies.slice(1).map(classRow)],
                histogramMemberships: backbone.plots.histogram.bins.map(row => ({binId: row.id, recordIds: row.recordIds, count: row.count})), totalCount: records.length};
        }
        case 'sample-cardinality': return {kind, enumeration: records.map((row, index) => ({recordId: row.id, ordinal: index + 1})), count: records.length};
        case 'variable-recording': return {kind, attributeId: backbone.study.attribute.id, incidences: records.map(row => ({
            recordId: row.id, unitId: row.unitId, occasionId: row.occasionId, attributeId: backbone.study.attribute.id,
            method: backbone.study.attribute.method, value: row.value}))};
        case 'empirical-shape': {
            const facts = backbone.shapeFacts, unequal = facts.reflections.find(row => row.count !== row.reflectedCount);
            return {kind, symmetry: unequal ? {kind: 'reflection-inequality', center: facts.midrange,
                frequencyId: unequal.frequencyId, reflectedValue: unequal.reflectedValue, reflectedFrequencyId: unequal.reflectedFrequencyId,
                firstCount: unequal.count, secondCount: unequal.reflectedCount}
                : {kind: 'reflection-equality', center: facts.midrange, pairs: facts.reflections.map(row => ({
                    frequencyId: row.frequencyId, reflectedFrequencyId: row.reflectedFrequencyId!, commonCount: row.count}))},
            maximumFrequencyIds: facts.maximumFrequencyIds, medianTailComparison: {left: facts.leftMedianExtent, right: facts.rightMedianExtent,
                relation: relation(facts.leftMedianExtent, facts.rightMedianExtent)}, gaps: facts.gaps};
        }
        case 'observed-variability': {
            const ordered = summary.orderedRecordIds.map(id => records.find(row => row.id === id)!);
            const index = ordered.findIndex((row, index) => index > 0 && compareAffineScalars(row.value, ordered[index - 1]!.value) > 0);
            if (index < 0) return fail('Observed variability requires an actual unequal pair.');
            const lower = ordered[index - 1]!, upper = ordered[index]!;
            return {kind, orderedRecordIds: [lower.id, upper.id], lower: lower.value, upper: upper.value,
                positiveDifference: affineCoefficientArithmetic('subtraction', upper.value, lower.value)};
        }
        case 'criterion-backed-departure': {
            const facts = backbone.departureFacts;
            if (!facts || facts.exceptionalRecordIds.length === 0) return fail('Departure evidence requires at least one actual separated record.');
            return {kind, facts, exceptionalRecordIds: [facts.exceptionalRecordIds[0]!, ...facts.exceptionalRecordIds.slice(1)]};
        }
        case 'single-record-replacement': return replacement ? makeSensitivity(backbone, replacement) : fail('A replacement descriptor is required.');
    }
}

/** Constructs mathematical certificates only; it never selects a learner task or a preferred statistic. */
export function buildNumericalDataProblem(input: NumericalDataBuildInput): NumericalDataProblem {
    try {
        if (!record(input) || !dense(input.relations) || input.relations.length === 0
            || input.relations.some(kind => !kinds.includes(kind as NumericalDataRelation['kind']))
            || new Set(input.relations).size !== input.relations.length
            || (input.relations.includes('single-record-replacement') !== (input.replacement !== undefined))
            || (input.replacement !== undefined && !record(input.replacement))) {
            return fail('Supply unique real relation kinds and a replacement descriptor exactly when its theorem is selected.');
        }
        const backbone = buildNumericalDataBackbone(input);
        const proofs = input.relations.map(kind => makeProof(kind, backbone, input.replacement));
        return {...backbone, relations: [proofs[0]!, ...proofs.slice(1)]};
    } catch (error) {
        if (error instanceof GeneratorValidationError) throw error;
        return fail('Expected readable source data and mathematical relation descriptors.');
    }
}

/** Total semantic guard: ordered mathematical positions stay ordered, ID-keyed certificates may be permuted. */
export function isNumericalDataProblem(value: unknown): value is NumericalDataProblem {
    try {
        if (!record(value)) return false;
        const relations = value.relations;
        if (!isNumericalDataBackbone(value) || !dense(relations) || relations.length === 0) return false;
        const seen = new Set<unknown>();
        return relations.every(proof => {
            if (!record(proof) || seen.has(proof.kind)) return false;
            seen.add(proof.kind);
            return selectedProof(proof, value);
        });
    } catch { return false; }
}
