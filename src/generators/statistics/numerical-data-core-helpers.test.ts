import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {NumericalDataRecord, NumericalDataScalar, NumericalDataStudy, SignedRationalAxis} from '../../types/problems.ts';
import {buildNumericalDataBackbone, isNumericalDataBackbone, isNumericalDataRecordedValue, isNumericalDataSummary,
    summarizeNumericalRecords, type NumericalDataBackboneInput} from './numerical-data-core-helpers.ts';

const q = (numerator: number, denominator = 1): NumericalDataScalar => ({numerator, denominator});
function scale(first: number, last: number, denominator = 1): SignedRationalAxis {
    const reduced = (value: number): NumericalDataScalar => {
        let a = Math.abs(value), b = denominator;
        while (b) [a, b] = [b, a % b];
        return q(value / a || 0, denominator / a);
    };
    const ticks = Array.from({length: last - first + 1}, (_, index) => reduced(first + index));
    return {minimum: ticks[0]!, maximum: ticks[ticks.length - 1]!, step: q(1, denominator), ticks, zeroIndex: -first || 0};
}
function input(values: readonly NumericalDataScalar[] = [q(1), q(2), q(3), q(4), q(9)]): NumericalDataBackboneInput {
    if (values.length < 4) throw new Error('Test input requires four rows.');
    const records = values.map((value, index) => ({id: `r${index}`, unitId: `u${index}`, occasionId: 'o', value}));
    return {study: {id: 's', populationName: 'Library visitors', observationalUnitName: 'visitor',
        units: [{id: records[0]!.unitId, name: records[0]!.unitId}, ...records.slice(1).map(row => ({id: row.unitId, name: row.unitId}))], occasions: [{id: 'o', name: 'Monday'}],
        selection: 'distinct-units', attribute: {id: 'a', name: 'Books borrowed', kind: 'count', unit: 'items', method: 'counted', countedObject: 'books'}, goal: {kind: 'routine-member'}},
        records: [records[0]!, records[1]!, records[2]!, records[3]!, ...records.slice(4)], axes: {value: scale(0, 10), count: scale(0, 10)},
        histogramEdges: [q(0), q(2), q(4), q(6), q(8), q(10)], quartileConvention: 'median-of-halves-excluding-odd-center',
        whiskerConvention: 'observed-minimum-maximum', departureCriterion: null};
}
const clone = <T>(value: T): T => structuredClone(value);
type Mutable = Record<string, any>;
const mutable = (value: unknown): Mutable => value as Mutable;
const records = (values: readonly NumericalDataScalar[]): NumericalDataRecord[] => values.map((value, index) => ({id: `r${index}`, unitId: 'unit', occasionId: `o${index}`, value}));

describe('numerical-data exact summaries', () => {
    it('matches independent odd and even literal quartile/MAD oracles, preserving stable duplicate ties', () => {
        const odd = summarizeNumericalRecords(input().records);
        expect(odd).toMatchObject({count: 5, sum: q(19), mean: q(19, 5), minimum: q(1), maximum: q(9),
            median: {positions: [3], centralRecordIds: ['r2'], value: q(3)},
            quartiles: {q1: q(3, 2), q3: q(13, 2)}, iqr: q(5), absoluteDeviationSum: q(54, 5), mad: q(54, 25)});
        const evenRecords = records([q(5), q(2), q(4), q(1)]), even = summarizeNumericalRecords(evenRecords);
        expect(even).toMatchObject({orderedRecordIds: ['r3', 'r1', 'r2', 'r0'], sum: q(12), mean: q(3),
            median: {positions: [2, 3], centralValues: [q(2), q(4)], value: q(3)}, quartiles: {q1: q(3, 2), q3: q(9, 2)}, iqr: q(3), mad: q(3, 2)});
        const ties = summarizeNumericalRecords(records([q(2), q(1), q(2), q(1), q(2)]));
        expect(ties.orderedRecordIds).toEqual(['r1', 'r3', 'r0', 'r2', 'r4']);
        expect(ties.deviations.map(row => row.recordId)).toEqual(['r0', 'r1', 'r2', 'r3', 'r4']);
        expect(isNumericalDataSummary(odd, input().records)).toBe(true);
        expect(isNumericalDataSummary(even, evenRecords)).toBe(true);
    });

    it('matches independent signed fractional and constant-data oracles', () => {
        const source = records([q(-3, 2), q(-1), q(-1, 2), q(0), q(5, 2)]), result = summarizeNumericalRecords(source);
        expect(result).toMatchObject({sum: q(-1, 2), mean: q(-1, 10), median: {value: q(-1, 2)}, quartiles: {q1: q(-5, 4), q3: q(5, 4)}, iqr: q(5, 2), mad: q(27, 25)});
        expect(result.deviations[0]).toEqual({recordId: 'r0', value: q(-3, 2), signedDifference: q(-7, 5), absoluteDifference: q(7, 5)});
        const constant = summarizeNumericalRecords(records([q(3), q(3), q(3), q(3)]));
        expect(constant).toMatchObject({median: {value: q(3)}, quartiles: {q1: q(3), q3: q(3)}, iqr: q(0), absoluteDeviationSum: q(0), mad: q(0)});
        expect(isNumericalDataSummary(result, source)).toBe(true);
    });

    it('keeps unsafe hidden prefixes wide while every actual stored scalar remains safe', () => {
        const k = 4503599627370495, source = records([q(k), q(k), q(2), q(-2)]), result = summarizeNumericalRecords(source);
        expect(BigInt(k) * 2n + 2n > BigInt(Number.MAX_SAFE_INTEGER)).toBe(true);
        expect(result.sum).toEqual(q(9007199254740990));
        expect(result.mean).toEqual(q(k, 2));
        expect(result.absoluteDeviationSum).toEqual(q(9007199254740990));
        expect(result.mad).toEqual(q(k, 2));
        expect(isNumericalDataSummary(result, source)).toBe(true);
        expect(() => summarizeNumericalRecords(records([q(Number.MAX_SAFE_INTEGER), q(Number.MAX_SAFE_INTEGER), q(1), q(1)]))).toThrow();
    });

    it('agrees with an independent BigInt integer oracle over a deterministic 625-member grid', () => {
        const gcd = (a: bigint, b: bigint): bigint => b ? gcd(b, a % b) : a < 0n ? -a : a;
        const rational = (n: bigint, d: bigint): NumericalDataScalar => { const g = gcd(n, d); return q(Number(n / g), Number(d / g)); };
        for (let a = -2; a <= 2; a++) for (let b = -2; b <= 2; b++) for (let c = -2; c <= 2; c++) for (let d = -2; d <= 2; d++) {
            const values = [a, b, c, d], ordered = [...values].sort((x, y) => x - y), sum = BigInt(a + b + c + d);
            const source = records(values.map(value => q(value))), result = summarizeNumericalRecords(source);
            const absoluteNumerator = values.reduce((total, value) => total + (4n * BigInt(value) - sum < 0n ? sum - 4n * BigInt(value) : 4n * BigInt(value) - sum), 0n);
            expect(result.mean).toEqual(rational(sum, 4n));
            expect(result.median.value).toEqual(rational(BigInt(ordered[1]! + ordered[2]!), 2n));
            expect(result.quartiles.q1).toEqual(rational(BigInt(ordered[0]! + ordered[1]!), 2n));
            expect(result.quartiles.q3).toEqual(rational(BigInt(ordered[2]! + ordered[3]!), 2n));
            expect(result.mad).toEqual(rational(absoluteNumerator, 16n));
            expect(isNumericalDataSummary(result, source)).toBe(true);
        }
    });

    it('rejects wrong summary linkage, order, arithmetic and conventions independently', () => {
        const source = input().records, baseline = summarizeNumericalRecords(source);
        const mutations: ((x: Mutable) => void)[] = [x => x.count++, x => x.sum = q(20), x => x.minimum = q(0), x => x.maximum = q(10),
            x => x.mean = q(4), x => x.orderedRecordIds.reverse(), x => x.median.positions = [2], x => x.median.centralRecordIds = ['r1'],
            x => x.median.centralValues = [q(2)], x => x.median.value = q(2), x => x.quartiles.convention = 'inclusive',
            x => x.quartiles.lowerHalf.orderedRecordIds.reverse(), x => x.quartiles.upperHalf.positions = [1], x => x.quartiles.q1 = q(1),
            x => x.quartiles.q3 = q(7), x => x.iqr = q(6), x => x.deviations.reverse(), x => x.deviations[0].value = q(2),
            x => x.deviations[0].signedDifference = q(14, 5), x => x.deviations[0].absoluteDifference = q(1),
            x => x.absoluteDeviationSum = q(11), x => x.mad = q(2), x => x.deviations.pop(), x => x.median.centralValues.push(q(3)),
            x => x.median.positions.push(3), x => delete x.quartiles.lowerHalf, x => x.deviations[0].recordId = 'missing'];
        mutations.forEach(change => { const bad = clone(baseline); change(mutable(bad)); expect(isNumericalDataSummary(bad, source)).toBe(false); });
        expect(isNumericalDataSummary(null, source)).toBe(false);
        expect(isNumericalDataSummary(baseline, source.slice(0, 3))).toBe(false);
    });
});

describe('source semantics and admissibility', () => {
    const length: NumericalDataStudy['attribute'] = {id: 'length', name: 'Ribbon length', kind: 'length', unit: 'centimeters', method: 'ruler', precision: q(1, 2)};
    const temperature: NumericalDataStudy['attribute'] = {id: 'temperature', name: 'Temperature', kind: 'temperature', unit: 'degrees-celsius', method: 'thermometer', precision: q(1, 2)};
    it('enforces original physical units/method/precision including signed Celsius and zero', () => {
        expect(isNumericalDataRecordedValue(q(0), length)).toBe(true);
        expect(isNumericalDataRecordedValue(q(3, 2), length)).toBe(true);
        expect(isNumericalDataRecordedValue(q(-1, 2), length)).toBe(false);
        expect(isNumericalDataRecordedValue(q(1, 4), length)).toBe(false);
        expect(isNumericalDataRecordedValue(q(-3, 2), temperature)).toBe(true);
        expect(isNumericalDataRecordedValue(q(1, 4), temperature)).toBe(false);
        const duration = {...length, kind: 'duration', unit: 'minutes', method: 'timer'} as const;
        expect(isNumericalDataRecordedValue(q(2), duration)).toBe(true);
        expect(isNumericalDataRecordedValue(q(1), {...duration, method: 'ruler'} as never)).toBe(false);
        expect(isNumericalDataRecordedValue(q(1), {...length, unit: 'seconds'} as never)).toBe(false);
        expect(isNumericalDataRecordedValue(q(1), {...length, precision: q(0)})).toBe(false);
        const count = input().study.attribute;
        expect(isNumericalDataRecordedValue(q(1, 2), count)).toBe(false);
        expect(isNumericalDataRecordedValue(q(0), count)).toBe(true);
        expect(isNumericalDataRecordedValue(q(1), {...count, countedObject: ''} as never)).toBe(false);
    });

    it('accepts repeated occasions and extensive goals, requiring all joins and actual repeated units', () => {
        const source = input([q(-3, 2), q(-1), q(-1, 2), q(0), q(5, 2)]);
        const rows = source.records.map((row, index) => ({...row, unitId: 'u', occasionId: `o${index}`}));
        const repeated: NumericalDataBackboneInput = {...source,
            study: {...source.study, units: [{id: 'u', name: 'Weather station'}], occasions: [{id: 'o0', name: 'Time 0'}, ...source.records.slice(1).map((_, index) => ({id: `o${index + 1}`, name: `Time ${index + 1}`}))],
                observationalUnitName: 'station', selection: 'repeated-occasions', attribute: temperature, goal: {kind: 'describe-recorded-collection'}},
            records: [rows[0]!, rows[1]!, rows[2]!, rows[3]!, ...rows.slice(4)],
            axes: {...source.axes, value: scale(-2, 3)}, histogramEdges: [q(-2), q(-1), q(0), q(1), q(2), q(3)]};
        expect(isNumericalDataBackbone(buildNumericalDataBackbone(repeated))).toBe(true);
        expect(() => buildNumericalDataBackbone({...repeated, study: {...repeated.study, goal: {kind: 'equally-allocated-total'}}})).toThrow();
        expect(isNumericalDataBackbone(buildNumericalDataBackbone({...input(), study: {...input().study, attribute: {...length, precision: q(1)}, goal: {kind: 'equally-allocated-total'}}}))).toBe(true);
    });

    it('rejects broken source identity, duplicate registries and mismatched source semantics', () => {
        const baseline = input();
        const mutations: ((x: Mutable) => void)[] = [x => x.study.id = '', x => x.study.units.push(x.study.units[0]),
            x => x.study.occasions.push(x.study.occasions[0]), x => x.study.units.push({id: 'unused', name: 'Unused'}),
            x => x.study.occasions.push({id: 'unused', name: 'Unused'}), x => x.records[1].id = x.records[0].id,
            x => x.records[1].unitId = x.records[0].unitId, x => x.records[0].occasionId = 'missing', x => x.records[0].unitId = 'missing',
            x => x.study.selection = 'repeated-occasions', x => x.study.selection = 'unsupported', x => x.study.goal.kind = 'unsupported',
            x => x.study.attribute.method = 'ruler', x => x.study.attribute.unit = 'seconds', x => x.study.attribute.kind = 'mass',
            x => x.records[0].value = q(-1), x => x.study.populationName = '', x => x.study.observationalUnitName = '',
            x => x.study.units[0].name = '', x => x.study.attribute.name = '', x => x.study.attribute.id = ''];
        mutations.forEach(change => { const bad = clone(baseline); change(mutable(bad)); expect(() => buildNumericalDataBackbone(bad)).toThrow(); });
    });
});

describe('complete numerical-data backbone', () => {
    it('constructs exact frequency/histogram/box/shape facts including fractional coordinates and final endpoints', () => {
        const source = input(), result = buildNumericalDataBackbone(source);
        expect(result.plots.histogram.bins.map(row => row.count)).toEqual([1, 2, 1, 0, 1]);
        expect(result.plots.histogram.bins.map(row => row.upperClosed)).toEqual([false, false, false, false, true]);
        expect(result.plots.box.q1).toEqual({value: q(3, 2), axisPosition: q(3, 2)});
        expect(result.plots.box.q3).toEqual({value: q(13, 2), axisPosition: q(13, 2)});
        expect(result.shapeFacts.midrange).toEqual(q(5));
        expect(result.shapeFacts.gaps.map(row => row.width)).toEqual([q(1), q(1), q(1), q(5)]);
        expect(result.shapeFacts.maximumFrequencyIds.length).toBe(5);
        expect(result.shapeFacts.reflections[0]).toMatchObject({reflectedValue: q(9), reflectedFrequencyId: result.frequencies[4]!.id, count: 1, reflectedCount: 1});
        expect(result.shapeFacts.reflections[1]).toMatchObject({reflectedValue: q(8), reflectedFrequencyId: null, reflectedCount: 0});
        expect(isNumericalDataBackbone({...result, relations: []})).toBe(true);
        const endpoint = buildNumericalDataBackbone(input([q(0), q(2), q(4), q(10)]));
        expect(endpoint.plots.histogram.bins.map(row => row.recordIds)).toEqual([['r0'], ['r1'], ['r2'], [], ['r3']]);
        expect(endpoint.plots.dots[0]!.valueLocation).toEqual({value: q(0), axisPosition: q(0)});
        expect(endpoint.plots.dots[3]!.valueLocation).toEqual({value: q(10), axisPosition: q(10)});
        const oneClass = buildNumericalDataBackbone(input([q(3), q(3), q(3), q(3)]));
        expect(oneClass.shapeFacts.gaps).toEqual([]);
        expect(oneClass.shapeFacts.reflections).toEqual([{frequencyId: oneClass.frequencies[0].id, reflectedValue: q(3), reflectedFrequencyId: oneClass.frequencies[0].id, count: 4, reflectedCount: 4}]);
    });

    it('preserves exact half-step precision on a coarser zero-containing axis', () => {
        const source = input([q(1, 2), q(1), q(1), q(3, 2), q(2), q(3)]);
        const result = buildNumericalDataBackbone({...source, study: {...source.study, attribute: {id: 'a', name: 'Ribbon length', kind: 'length', unit: 'meters', method: 'ruler', precision: q(1, 2)}, goal: {kind: 'equally-allocated-total'}},
            axes: {...source.axes, value: scale(0, 3)}, histogramEdges: [q(0), q(1), q(2), q(3)]});
        expect(result.summary).toMatchObject({mean: q(3, 2), median: {value: q(5, 4)}, quartiles: {q1: q(1), q3: q(2)}, mad: q(2, 3)});
        expect(result.plots.dots[0]!.valueLocation).toEqual({value: q(1, 2), axisPosition: q(1, 2)});
        expect(result.plots.box.median.axisPosition).toEqual(q(5, 4));
        expect(result.plots.histogram.bins.map(row => row.count)).toEqual([1, 3, 2]);
        expect(isNumericalDataBackbone(result)).toBe(true);
    });

    it('accepts all ID-keyed permutations, arbitrary IDs and equal-value stack bijections', () => {
        const result = clone(buildNumericalDataBackbone(input([q(2), q(2), q(3), q(3), q(4), q(4)])));
        const value = mutable(result);
        value.study.units.reverse(); value.study.occasions.reverse(); value.frequencies.reverse();
        value.frequencies.forEach((row: Mutable) => row.recordIds.reverse());
        value.plots.histogram.bins.forEach((row: Mutable) => row.recordIds.reverse());
        const dots = value.plots.dots.filter((row: Mutable) => row.frequencyId === value.frequencies[0].id);
        [dots[0].stackOrdinal, dots[1].stackOrdinal] = [dots[1].stackOrdinal, dots[0].stackOrdinal];
        [dots[0].stackLocation, dots[1].stackLocation] = [dots[1].stackLocation, dots[0].stackLocation];
        value.plots.dots.reverse(); value.shapeFacts.gaps.reverse(); value.shapeFacts.reflections.reverse(); value.shapeFacts.maximumFrequencyIds.reverse();
        expect(isNumericalDataBackbone(result)).toBe(true);
        const renamed = JSON.parse(JSON.stringify(result).replaceAll('frequency-', 'class:').replaceAll('bin-', 'interval:'));
        expect(isNumericalDataBackbone(renamed)).toBe(true);
        expect(() => { value.study.units[0].name = 'Changed externally'; }).not.toThrow();
        const original = input(), built = buildNumericalDataBackbone(original);
        mutable(original).records[0].value.numerator = 100;
        mutable(original).study.units[0].name = 'Changed';
        mutable(original).axes.value.ticks[0].numerator = 100;
        expect(built.records[0].value).toEqual(q(1));
        expect(built.study.units[0].name).toBe('u0');
        expect(built.plots.valueAxis.ticks[0]).toEqual(q(0));
    });

    it('rejects independent frequency, plot, shape and scale corruptions', () => {
        const baseline = buildNumericalDataBackbone(input([q(2), q(2), q(3), q(3), q(4), q(4)]));
        const mutations: ((x: Mutable) => void)[] = [x => x.kind = 'other', x => delete x.shapeFacts,
            x => x.frequencies[0].recordIds.pop(), x => x.frequencies[0].count++, x => x.frequencies[0].id = x.frequencies[1].id,
            x => x.frequencies[0].value = x.frequencies[1].value, x => x.frequencies.push({...x.frequencies[0], id: 'extra', value: q(8)}), x => x.frequencies.pop(),
            x => x.plots.dots.pop(), x => x.plots.dots[0].recordId = 'missing', x => x.plots.dots[1].recordId = x.plots.dots[0].recordId,
            x => x.plots.dots[0].frequencyId = 'missing', x => x.plots.dots[0].stackOrdinal = 0, x => x.plots.dots[0].stackOrdinal = 3,
            x => x.plots.dots[1].stackOrdinal = x.plots.dots[0].stackOrdinal, x => x.plots.dots[0].valueLocation.value = q(5),
            x => x.plots.dots[0].valueLocation.axisPosition = q(1), x => x.plots.dots[0].stackLocation.value = q(3),
            x => x.plots.valueAxis.zeroIndex = -0, x => x.plots.valueAxis.ticks[1] = q(3), x => x.plots.valueAxis.step = q(0),
            x => x.plots.countAxis = scale(-1, 9), x => x.plots.countAxis.ticks[0] = q(-1),
            x => x.plots.histogram.width = q(0), x => x.plots.histogram.convention = 'density', x => x.plots.histogram.bins.reverse(),
            x => x.plots.histogram.bins[0].id = x.plots.histogram.bins[1].id, x => x.plots.histogram.bins[0].upper = q(3),
            x => x.plots.histogram.bins[0].lowerClosed = false, x => x.plots.histogram.bins[0].upperClosed = true,
            x => x.plots.histogram.bins[0].count++, x => x.plots.histogram.bins[1].recordIds.reverse().pop(),
            x => x.plots.histogram.bins[1].left.axisPosition = q(0), x => x.plots.histogram.bins[1].right.value = q(0),
            x => x.plots.histogram.bins[1].top.value = q(0), x => x.plots.box.whiskerConvention = 'fences',
            x => x.plots.box.quartileConvention = 'inclusive', x => x.plots.box.q1.value = q(1), x => x.plots.box.q3.axisPosition = q(1),
            x => x.plots.box.minimum.value = q(0), x => x.plots.box.maximum.value = q(5), x => x.plots.box.median.value = q(4),
            x => x.shapeFacts.gaps.pop(), x => x.shapeFacts.gaps[1].leftFrequencyId = x.shapeFacts.gaps[0].leftFrequencyId,
            x => x.shapeFacts.gaps[0].rightFrequencyId = 'missing', x => x.shapeFacts.gaps[0].width = q(2),
            x => x.shapeFacts.maximumFrequency = 0, x => x.shapeFacts.maximumFrequencyIds.pop(), x => x.shapeFacts.midrange = q(4),
            x => x.shapeFacts.leftMedianExtent = q(0), x => x.shapeFacts.rightMedianExtent = q(0), x => x.shapeFacts.reflections.pop(),
            x => x.shapeFacts.reflections[1].frequencyId = x.shapeFacts.reflections[0].frequencyId, x => x.shapeFacts.reflections[0].reflectedValue = q(5),
            x => x.shapeFacts.reflections[0].reflectedFrequencyId = null, x => x.shapeFacts.reflections[0].count++, x => x.shapeFacts.reflections[0].reflectedCount--,
            x => delete x.shapeFacts.gaps[0].width, x => delete x.shapeFacts.reflections[0].count,
            x => delete x.frequencies[0].recordIds, x => delete x.plots.dots[0].stackLocation, x => delete x.plots.histogram.bins[0].top];
        mutations.forEach((change, index) => { const bad = clone(baseline); change(mutable(bad)); expect(isNumericalDataBackbone(bad), `mutation ${index}`).toBe(false); });
    });

    it('validates empty configuration, exact bin width, complete coverage and actual scale capacity', () => {
        const baseline = input();
        expect(() => buildNumericalDataBackbone({} as never)).toThrow();
        expect(() => buildNumericalDataBackbone({...baseline, histogramEdges: [q(0), q(3), q(5)]})).toThrow();
        expect(() => buildNumericalDataBackbone({...baseline, histogramEdges: [q(2), q(0)]})).toThrow();
        expect(() => buildNumericalDataBackbone({...baseline, histogramEdges: [q(0), q(2), q(4)]})).toThrow();
        expect(() => buildNumericalDataBackbone({...baseline, axes: {...baseline.axes, value: scale(0, 5)}})).toThrow();
        expect(() => buildNumericalDataBackbone({...input([q(2), q(2), q(2), q(2)]), axes: {...baseline.axes, count: scale(0, 3)}})).toThrow();
        expect(() => buildNumericalDataBackbone({...baseline, axes: {...baseline.axes, count: scale(-1, 5)}})).toThrow();
        expect(() => buildNumericalDataBackbone({...baseline, quartileConvention: 'other'} as never)).toThrow();
        expect(() => buildNumericalDataBackbone({...baseline, whiskerConvention: 'other'} as never)).toThrow();
    });
});

describe('reference-majority departure evidence', () => {
    const departed = (values: readonly NumericalDataScalar[] = [q(0), q(2), q(2), q(4), q(7)]) => buildNumericalDataBackbone({...input(values),
        departureCriterion: {kind: 'separated-from-routine-majority', lower: q(0), upper: q(4), minimumSeparation: q(3), referenceSource: 'routine-operation-reference'}});
    it('uses actual strict majority, nearest empirical gap and inclusive threshold rather than band-only violations', () => {
        const baseline = departed(), facts = baseline.departureFacts!;
        expect(facts.ordinaryRecordIds).toEqual(['r0', 'r1', 'r2', 'r3']);
        expect(facts.exceptionalRecordIds).toEqual(['r4']);
        expect(facts.separations).toEqual([{recordId: 'r4', nearestOrdinaryRecordId: 'r3', subtraction: {kind: 'binary', operation: 'subtraction', operands: [q(7), q(4)], result: q(3)}, absoluteDifference: q(3), thresholdRelation: 'equal'}]);
        const notExceptional = departed([q(0), q(2), q(2), q(4), q(5)]);
        expect(notExceptional.departureFacts!.exceptionalRecordIds).toEqual([]);
        expect(notExceptional.departureFacts!.separations[0]!.thresholdRelation).toBe('less');
        const farther = departed([q(0), q(2), q(2), q(4), q(9)]);
        expect(farther.departureFacts!.separations[0]!.thresholdRelation).toBe('greater');
        expect(isNumericalDataBackbone(farther)).toBe(true);
        expect(isNumericalDataBackbone(notExceptional)).toBe(true);
        const allOrdinary = departed([q(0), q(2), q(2), q(4)]);
        expect(allOrdinary.departureFacts!.separations).toEqual([]);
        expect(isNumericalDataBackbone(allOrdinary)).toBe(true);
    });

    it('accepts nearest-identity ties, unordered evidence and either exact subtraction orientation', () => {
        const result = departed([q(0), q(2), q(4), q(4), q(7)]), value = mutable(result.departureFacts);
        value.ordinaryRecordIds.reverse(); value.comparisons.reverse(); value.separations.reverse(); value.exceptionalRecordIds.reverse();
        value.separations[0].nearestOrdinaryRecordId = 'r2';
        value.separations[0].subtraction.operands.reverse(); value.separations[0].subtraction.result = q(-3);
        expect(isNumericalDataBackbone(result)).toBe(true);
        const source = input([q(-5), q(-4), q(-4), q(-3), q(-3), q(-2), q(6)]);
        const signed = buildNumericalDataBackbone({...source, study: {...source.study, attribute: {id: 'a', name: 'Air temperature', kind: 'temperature', unit: 'degrees-celsius', method: 'thermometer', precision: q(1)}},
            axes: {...source.axes, value: scale(-6, 6)}, histogramEdges: [q(-6), q(-4), q(-2), q(0), q(2), q(4), q(6)],
            departureCriterion: {kind: 'separated-from-routine-majority', lower: q(-5), upper: q(-2), minimumSeparation: q(3), referenceSource: 'study-reference-range'}});
        expect(signed.summary).toMatchObject({mean: q(-15, 7), mad: q(116, 49)});
        expect(signed.departureFacts!.separations[0]!.absoluteDifference).toEqual(q(8));
        expect(isNumericalDataBackbone(signed)).toBe(true);
        const below = buildNumericalDataBackbone({...source, study: signed.study, axes: {...source.axes, value: scale(-6, 6)}, histogramEdges: [q(-6), q(-4), q(-2), q(0), q(2), q(4), q(6)],
            departureCriterion: {kind: 'separated-from-routine-majority', lower: q(-4), upper: q(6), minimumSeparation: q(1), referenceSource: 'study-reference-range'}});
        expect(below.departureFacts!.separations[0]!.subtraction.result).toEqual(q(-1));
        expect(isNumericalDataBackbone(below)).toBe(true);
    });

    it('rejects wrong references, omitted outside rows, non-nearest witnesses, arithmetic and thresholds', () => {
        const baseline = departed();
        const mutations: ((x: Mutable) => void)[] = [x => x.criterion.lower = q(5), x => x.criterion.minimumSeparation = q(0),
            x => x.criterion.kind = 'fence', x => x.criterion.referenceSource = 'invented', x => x.ordinaryRecordIds.pop(),
            x => x.comparisons.pop(), x => x.comparisons[1].recordId = x.comparisons[0].recordId, x => x.comparisons[0].lowerRelation = 'less',
            x => x.comparisons[0].upperRelation = 'greater', x => x.comparisons[0].outside = true, x => x.exceptionalRecordIds = [],
            x => x.separations = [], x => x.separations[0].recordId = 'r0', x => x.separations[0].nearestOrdinaryRecordId = 'r0',
            x => x.separations[0].nearestOrdinaryRecordId = 'missing', x => x.separations[0].absoluteDifference = q(4),
            x => x.separations[0].thresholdRelation = 'greater', x => x.separations[0].subtraction.result = q(-3),
            x => x.separations[0].subtraction.operands = [q(8), q(5)], x => x.separations[0].subtraction.operation = 'addition',
            x => x.separations[0].subtraction.kind = 'unary', x => x.separations[0].subtraction.operands.pop(),
            x => delete x.separations[0].subtraction, x => delete x.comparisons[0].outside];
        mutations.forEach((change, index) => { const bad = clone(baseline); change(mutable(bad.departureFacts)); expect(isNumericalDataBackbone(bad), `departure mutation ${index}`).toBe(false); });
        const multiple = departed([q(0), q(2), q(4), q(7), q(9)]);
        mutable(multiple).departureFacts.separations[1].recordId = 'r3';
        expect(isNumericalDataBackbone(multiple)).toBe(false);
        expect(() => departed([q(0), q(4), q(7), q(9)])).toThrow();
        expect(() => buildNumericalDataBackbone({...input(), departureCriterion: {kind: 'separated-from-routine-majority', lower: q(5), upper: q(4), minimumSeparation: q(1), referenceSource: 'study-reference-range'}})).toThrow();
    });
});

describe('total defensive guards', () => {
    it('normalizes hostile constructor failures and retains existing typed error identity', () => {
        const unexpected = new Proxy({}, {getOwnPropertyDescriptor: () => { throw new Error('hostile descriptor'); }});
        expect(() => buildNumericalDataBackbone(unexpected as never)).toThrow(GeneratorValidationError);
        const unreadableRecords = new Proxy(input().records, {getOwnPropertyDescriptor: () => { throw new Error('hostile record array'); }});
        expect(() => summarizeNumericalRecords(unreadableRecords)).toThrow(GeneratorValidationError);
        const typed = new GeneratorValidationError('numerical-data', 'Preserve this exact failure');
        const typedInput = new Proxy({}, {getOwnPropertyDescriptor: () => { throw typed; }});
        const typedRecords = new Proxy(input().records, {getOwnPropertyDescriptor: () => { throw typed; }});
        expect(() => buildNumericalDataBackbone(typedInput as never)).toThrow(typed);
        expect(() => summarizeNumericalRecords(typedRecords)).toThrow(typed);
        const nested = {...input(), records: new Proxy(input().records, {get() { throw new Error('hostile array length'); }})};
        expect(() => buildNumericalDataBackbone(nested)).toThrow(GeneratorValidationError);
    });

    it('accepts broad complete scales, many classes and a single bin containing every record', () => {
        const values = Array.from({length: 40}, (_, index) => q(index));
        const source = input(values), result = buildNumericalDataBackbone({...source, axes: {value: scale(0, 40), count: scale(0, 40)}, histogramEdges: [q(0), q(40)]});
        expect(result.frequencies).toHaveLength(40);
        expect(result.shapeFacts.maximumFrequencyIds).toHaveLength(40);
        expect(result.plots.histogram.bins[0].count).toBe(40);
        expect(result.plots.histogram.bins[0].recordIds).toHaveLength(40);
        expect(result.summary.median.value).toEqual(q(39, 2));
        expect(result.plots.box.median.axisPosition).toEqual(q(39, 2));
        expect(isNumericalDataBackbone(result)).toBe(true);
    });

    it('rejects sparse/inherited/accessor/cyclic/malformed values without reading hostile data', () => {
        const baseline = buildNumericalDataBackbone(input()), source = input().records;
        const sparse = new Array(1_000_000_000);
        expect(() => summarizeNumericalRecords(sparse)).toThrow();
        expect(isNumericalDataSummary(baseline.summary, sparse)).toBe(false);
        expect(isNumericalDataBackbone({...baseline, records: sparse})).toBe(false);
        const inherited = Object.create(baseline);
        expect(isNumericalDataBackbone(inherited)).toBe(false);
        const getter = {...baseline}; Object.defineProperty(getter, 'records', {get: () => { throw new Error('hostile'); }});
        expect(isNumericalDataBackbone(getter)).toBe(false);
        const badScalar = Object.defineProperty({denominator: 1}, 'numerator', {get: () => { throw new Error('hostile'); }});
        expect(isNumericalDataRecordedValue(badScalar, input().study.attribute)).toBe(false);
        const hostile = new Proxy({}, {getOwnPropertyDescriptor: () => { throw new Error('hostile'); }});
        expect(isNumericalDataBackbone(hostile)).toBe(false);
        expect(isNumericalDataSummary(hostile, source)).toBe(false);
        expect(isNumericalDataRecordedValue(q(1), hostile as never)).toBe(false);
        expect(isNumericalDataRecordedValue(hostile, input().study.attribute)).toBe(false);
        const cyc: Mutable = {}; cyc.numerator = cyc; cyc.denominator = 1;
        [q(-0), q(2, 2), q(0, 2), q(1, 0), q(1, -2), q(1.5), q(Number.MAX_SAFE_INTEGER + 1), cyc, null, undefined].forEach(value => {
            expect(isNumericalDataRecordedValue(value, input().study.attribute)).toBe(false);
            expect(isNumericalDataBackbone({...baseline, records: [{...source[0], value}, ...source.slice(1)]})).toBe(false);
        });
        const sparseOwn = clone(baseline); delete mutable(sparseOwn).plots.dots[0];
        expect(isNumericalDataBackbone(sparseOwn)).toBe(false);
        const inheritedArray = clone(baseline); Object.setPrototypeOf(mutable(inheritedArray).frequencies, {0: baseline.frequencies[0]}); delete mutable(inheritedArray).frequencies[0];
        expect(isNumericalDataBackbone(inheritedArray)).toBe(false);
        expect(isNumericalDataBackbone(null)).toBe(false);
        expect(isNumericalDataSummary(null, source)).toBe(false);
    });
});
