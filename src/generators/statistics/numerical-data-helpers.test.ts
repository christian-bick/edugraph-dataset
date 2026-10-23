import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {ExactCoefficientArithmetic, NumericalDataProblem, NumericalDataRelation, NumericalDataScalar,
    NumericalDataSummaryCore, SignedRationalAxis} from '../../types/problems.ts';
import {buildNumericalDataBackbone} from './numerical-data-core-helpers.ts';
import {buildNumericalDataProblem as build, isNumericalDataProblem as valid, type NumericalDataBuildInput} from './numerical-data-helpers.ts';

/** Independent rational oracle: no production scalar/proof constructor builds expectations. */
function q(n: number | bigint, d: number | bigint = 1): NumericalDataScalar {
    let a = BigInt(n), b = BigInt(d), x = a < 0n ? -a : a, y = b;
    while (y) [x, y] = [y, x % y];
    a /= x; b /= x;
    return {numerator: Number(a), denominator: Number(b)};
}
const binary = (operation: ExactCoefficientArithmetic['operation'], a: NumericalDataScalar, b: NumericalDataScalar,
    result: NumericalDataScalar): ExactCoefficientArithmetic => ({kind: 'binary', operation, operands: [a, b], result});
const axis = (minimum: number, maximum: number): SignedRationalAxis => ({minimum: q(minimum), maximum: q(maximum), step: q(1),
    ticks: Array.from({length: maximum - minimum + 1}, (_, index) => q(minimum + index)), zeroIndex: -minimum || 0});
const all: NumericalDataBuildInput['relations'] = ['arithmetic-mean', 'median', 'quartiles', 'mean-absolute-deviation',
    'interquartile-range', 'frequency-partition', 'sample-cardinality', 'variable-recording', 'empirical-shape',
    'observed-variability', 'criterion-backed-departure', 'single-record-replacement'];
const input = (values = [2, 2, 3, 3, 3, 4, 4, 15], relations: NumericalDataBuildInput['relations'] = all): NumericalDataBuildInput => {
    const records = values.map((value, index) => ({id: `r${index + 1}`, unitId: `unit-${index + 1}`, occasionId: 'today', value: q(value)}));
    const units = records.map(row => ({id: row.unitId, name: row.unitId}));
    return {study: {id: 'ribbons', populationName: 'Recorded classroom ribbons', observationalUnitName: 'ribbon',
        units: [units[0]!, ...units.slice(1)],
        occasions: [{id: 'today', name: 'Today'}], selection: 'distinct-units',
        attribute: {id: 'length', name: 'Length', kind: 'length', method: 'ruler', unit: 'centimeters', precision: q(1, 2)},
        goal: {kind: 'routine-member'}}, records: [records[0]!, records[1]!, records[2]!, records[3]!, ...records.slice(4)],
        axes: {value: axis(-20, 20), count: axis(0, Math.max(values.length, 8))}, histogramEdges: [q(-20), q(-10), q(0), q(10), q(20)],
        quartileConvention: 'median-of-halves-excluding-odd-center', whiskerConvention: 'observed-minimum-maximum',
        departureCriterion: relations.includes('criterion-backed-departure') ? {kind: 'separated-from-routine-majority',
            lower: q(2), upper: q(4), minimumSeparation: q(3), referenceSource: 'study-reference-range'} : null,
        relations, ...(relations.includes('single-record-replacement') ? {replacement: {recordId: 'r8', value: q(3), referenceSource: 'documented-routine-value' as const}} : {})};
};
const copy = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const withRelations = (source: NumericalDataProblem, relations: NumericalDataRelation[]): NumericalDataProblem => ({...source, relations: [relations[0]!, ...relations.slice(1)]});
const proof = <K extends NumericalDataRelation['kind']>(data: NumericalDataProblem, kind: K): Extract<NumericalDataRelation, {kind: K}> =>
    data.relations.find(row => row.kind === kind)! as Extract<NumericalDataRelation, {kind: K}>;
const mutated = (data: NumericalDataProblem, mutate: (value: any) => void): unknown => {
    const result = copy(data); mutate(result); return result;
};
const reject = (data: NumericalDataProblem, mutations: ((value: any) => void)[]) => {
    for (const mutation of mutations) expect(valid(mutated(data, mutation))).toBe(false);
};

describe('numerical-data selected mathematical proof facade', () => {
    it('accepts independent literal mean and even-middle certificates, retaining duplicate records', () => {
        const backbone = buildNumericalDataBackbone(input([1, 2, 2, 3, 4, 6], ['arithmetic-mean']));
        const literal: NumericalDataProblem = {...backbone, relations: [{kind: 'arithmetic-mean',
            recordIds: ['r6', 'r2', 'r3', 'r1', 'r5', 'r4'], sum: q(18), quotient: binary('division', q(18), q(6), q(3))},
        {kind: 'median', positional: {middle: {orderedRecordIds: ['r1', 'r2', 'r3', 'r4', 'r5', 'r6'], positions: [3, 4],
            centralRecordIds: ['r3', 'r4'], centralValues: [q(2), q(3)], value: q(5, 2)},
        arithmetic: {kind: 'central-pair-average', operands: [q(3), q(2)], divisor: 2, result: q(5, 2)}}}]};
        expect(valid(literal)).toBe(true);
        expect(backbone.summary.mean).toEqual(q(3));
        expect(backbone.summary.mad).toEqual(q(4, 3));
        expect(backbone.summary.quartiles.q1).toEqual(q(2));
        expect(backbone.summary.quartiles.q3).toEqual(q(4));
        reject(literal, [v => v.relations[0].recordIds[0] = 'r2', v => v.relations[0].sum = q(17),
            v => v.relations[0].quotient.operands.reverse(), v => v.relations[1].positional.middle.centralRecordIds.reverse(),
            v => v.relations[1].positional.arithmetic.divisor = 3, v => v.relations[1].positional.arithmetic.operands[0] = q(4)]);
    });

    it('builds all twelve actual theorem kinds with exact independent counterfactual results', () => {
        const data = build(input());
        expect(valid(data)).toBe(true);
        expect(data.relations.map(row => row.kind)).toEqual(all);
        expect(data.summary.mean).toEqual(q(9, 2));
        expect(data.summary.median.value).toEqual(q(3));
        expect(data.summary.mad).toEqual(q(21, 8));
        expect(data.summary.iqr).toEqual(q(3, 2));
        const replacement = proof(data, 'single-record-replacement');
        expect(replacement.modified.sum).toEqual(q(24));
        expect(replacement.modified.mean).toEqual(q(3));
        expect(replacement.modified.median.value).toEqual(q(3));
        expect(replacement.modified.mad).toEqual(q(1, 2));
        expect(replacement.modified.iqr).toEqual(q(1));
        expect(replacement.changes.map(row => row.difference.result)).toEqual([q(-3, 2), q(0), q(-17, 8), q(-1, 2)]);
        expect(replacement.centerChangeRelation).toBe('greater');
        expect(replacement.spreadChangeRelation).toBe('greater');
        expect(proof(data, 'criterion-backed-departure').exceptionalRecordIds).toEqual(['r8']);
        expect(proof(data, 'criterion-backed-departure').facts.separations[0]!.absoluteDifference).toEqual(q(11));
        expect(Object.keys(data)).not.toContain('profile');
    });

    it('covers each genuine correlated producer bundle and permits broad coherent combinations', () => {
        const bundles: NumericalDataBuildInput['relations'][] = [
            ['empirical-shape', 'observed-variability', 'arithmetic-mean', 'mean-absolute-deviation'],
            ['empirical-shape', 'observed-variability', 'median', 'interquartile-range'], ['arithmetic-mean'], ['median'],
            ['mean-absolute-deviation'], ['interquartile-range'], ['frequency-partition'], ['quartiles', 'median'],
            ['sample-cardinality'], ['variable-recording'], ['empirical-shape', 'criterion-backed-departure'],
            ['arithmetic-mean', 'median', 'mean-absolute-deviation', 'interquartile-range', 'empirical-shape', 'single-record-replacement']];
        for (const bundle of bundles) {
            const result = build(input(undefined, bundle));
            expect(valid(result)).toBe(true);
            expect(new Set(result.relations.map(row => row.kind))).toEqual(new Set(bundle));
        }
        const combined = build(input());
        expect(valid(withRelations(combined, [...combined.relations].reverse()))).toBe(true);
    });

    it('accepts ID-keyed permutations, arbitrary sample bijections and commuted fused central averages', () => {
        const data: any = copy(build(input()));
        for (const row of data.relations) {
            if (row.kind === 'arithmetic-mean') row.recordIds.reverse();
            if (row.kind === 'mean-absolute-deviation') row.deviations.reverse();
            if (row.kind === 'frequency-partition') {
                row.classes.reverse(); row.classes.forEach((item: any) => item.recordIds.reverse()); row.histogramMemberships.reverse();
            }
            if (row.kind === 'sample-cardinality') { row.enumeration.reverse(); row.enumeration.forEach((item: any, index: number) => item.ordinal = index + 1); }
            if (row.kind === 'variable-recording') row.incidences.reverse();
            if (row.kind === 'empirical-shape') { row.gaps.reverse(); row.maximumFrequencyIds.reverse(); }
        }
        const commute = (value: any): void => {
            if (!value || typeof value !== 'object') return;
            if (value.kind === 'central-pair-average') value.operands.reverse();
            Object.values(value).forEach(commute);
        };
        commute(data.relations);
        data.relations.reverse();
        expect(valid(data)).toBe(true);
    });

    it('accepts odd-middle positions and constant collections without asserting variability', () => {
        const data = build(input([1, 2, 3, 4, 9], ['median', 'quartiles', 'interquartile-range']));
        expect(valid(data)).toBe(true);
        expect(proof(data, 'median').positional.arithmetic).toEqual({kind: 'single-central-value', recordId: 'r3', value: q(3)});
        expect(data.summary.quartiles.q1).toEqual(q(3, 2));
        expect(data.summary.quartiles.q3).toEqual(q(13, 2));
        reject(data, [v => v.relations[0].positional.arithmetic.recordId = 'r4', v => v.relations[0].positional.arithmetic.value = q(4),
            v => v.relations[1].lowerHalf.arithmetic.kind = 'single-central-value', v => v.relations[2].subtraction.operands.reverse()]);
        expect(valid(build(input([3, 3, 3, 3], ['empirical-shape', 'arithmetic-mean', 'mean-absolute-deviation'])))).toBe(true);
        expect(() => build(input([3, 3, 3, 3], ['observed-variability']))).toThrow(GeneratorValidationError);
    });

    it('checks complete directed symmetry certificates and accepts any genuine asymmetric witness', () => {
        const symmetric = build(input([1, 2, 2, 3], ['empirical-shape']));
        expect(valid(symmetric)).toBe(true);
        const symmetricProof = proof(symmetric, 'empirical-shape');
        expect(symmetricProof.symmetry.kind).toBe('reflection-equality');
        expect(valid(mutated(symmetric, v => v.relations[0].symmetry.pairs.reverse()))).toBe(true);
        reject(symmetric, [v => v.relations[0].symmetry.pairs.pop(), v => v.relations[0].symmetry.pairs[1] = v.relations[0].symmetry.pairs[0],
            v => v.relations[0].symmetry.pairs[0].commonCount = 3, v => v.relations[0].symmetry.pairs[0].reflectedFrequencyId = 'missing']);
        const asymmetric = build(input([1, 2, 2, 3, 7], ['empirical-shape']));
        const alternate = asymmetric.shapeFacts.reflections.filter(row => row.count !== row.reflectedCount).at(-1)!;
        const value = mutated(asymmetric, v => v.relations[0].symmetry = {kind: 'reflection-inequality', center: asymmetric.shapeFacts.midrange,
            frequencyId: alternate.frequencyId, reflectedValue: alternate.reflectedValue, reflectedFrequencyId: alternate.reflectedFrequencyId,
            firstCount: alternate.count, secondCount: alternate.reflectedCount});
        expect(valid(value)).toBe(true);
        reject(asymmetric, [v => v.relations[0].symmetry.firstCount = 0, v => v.relations[0].symmetry.reflectedValue = q(99),
            v => v.relations[0].symmetry.kind = 'reflection-equality', v => v.relations[0].medianTailComparison.relation = 'equal',
            v => v.relations[0].gaps[0].width = q(99), v => v.relations[0].maximumFrequencyIds = []]);
    });

    it('accepts any actual unequal variability pair, while rejecting reversed or fictitious designated work', () => {
        const data = build(input(undefined, ['observed-variability']));
        const alternate = withRelations(data, [{kind: 'observed-variability', orderedRecordIds: ['r1', 'r7'], lower: q(2), upper: q(4),
            positiveDifference: binary('subtraction', q(4), q(2), q(2))}]);
        expect(valid(alternate)).toBe(true);
        reject(alternate, [v => v.relations[0].orderedRecordIds.reverse(), v => v.relations[0].orderedRecordIds[1] = 'missing',
            v => v.relations[0].lower = q(1), v => v.relations[0].positiveDifference.operation = 'addition',
            v => v.relations[0].positiveDifference.operands.reverse()]);
    });

    it('admits nearest-group ties and either signed separation orientation, preserving the original criterion', () => {
        const data = build(input(undefined, ['criterion-backed-departure']));
        const alternate = mutated(data, v => {
            const facts = v.relations[0].facts;
            facts.comparisons.reverse(); facts.ordinaryRecordIds.reverse();
            facts.separations[0].nearestOrdinaryRecordId = 'r7';
            facts.separations[0].subtraction = binary('subtraction', q(4), q(15), q(-11));
        });
        expect(valid(alternate)).toBe(true);
        reject(data, [v => v.relations[0].facts.criterion.minimumSeparation = q(2), v => v.relations[0].facts.criterion.referenceSource = 'routine-operation-reference',
            v => v.relations[0].facts.comparisons.pop(), v => v.relations[0].facts.comparisons[0].outside = true,
            v => v.relations[0].facts.ordinaryRecordIds.pop(), v => v.relations[0].facts.separations[0].nearestOrdinaryRecordId = 'r1',
            v => v.relations[0].facts.separations[0].absoluteDifference = q(13), v => v.relations[0].facts.separations[0].thresholdRelation = 'less',
            v => v.relations[0].facts.separations[0].subtraction.result = q(10), v => v.relations[0].exceptionalRecordIds = [],
            v => v.relations[0].facts.exceptionalRecordIds = [], v => v.relations[0].facts.separations[0].recordId = 'missing']);
        expect(() => build({...input([2, 2, 3, 3], ['criterion-backed-departure'])})).toThrow(GeneratorValidationError);
    });

    it('verifies a replacement summary without creating a modified chart or restricting it to the original frame', () => {
        const source = input(undefined, ['single-record-replacement']);
        const data = build({...source, replacement: {recordId: 'r8', value: q(100), referenceSource: 'documented-routine-value'}});
        expect(valid(data)).toBe(true);
        const selected = proof(data, 'single-record-replacement');
        expect(selected.modified.maximum).toEqual(q(100));
        expect(data.plots.valueAxis.maximum).toEqual(q(20));
        expect(Object.keys(selected.modified)).not.toContain('plots');
        reject(data, [v => v.relations[0].recordId = 'missing', v => v.relations[0].originalValue = q(4),
            v => v.relations[0].replacementValue = q(15), v => v.relations[0].replacementValue = q(-1),
            v => v.relations[0].replacementValue = q(1, 3), v => v.relations[0].referenceSource = 'guessed',
            v => v.relations[0].modified.mean = q(1), v => v.relations[0].modifiedProofs.reverse(),
            v => v.relations[0].changes[0].difference.operands.reverse(), v => v.relations[0].changes[1].measure = 'mean',
            v => v.relations[0].changes[2].absoluteDifference = q(0), v => v.relations[0].centerChangeRelation = 'equal',
            v => v.relations[0].spreadChangeRelation = 'equal']);
    });

    it('retains original count integrality and signed Celsius precision for counterfactual values', () => {
        const base = input(undefined, ['single-record-replacement']);
        const counted = {...base, study: {...base.study, attribute: {id: 'count', name: 'Pencils', kind: 'count' as const,
            unit: 'items' as const, method: 'counted' as const, countedObject: 'pencils'}}};
        expect(valid(build(counted))).toBe(true);
        expect(() => build({...counted, replacement: {recordId: 'r8', value: q(5, 2), referenceSource: 'documented-routine-value'}})).toThrow(GeneratorValidationError);
        const temperature = {...base, study: {...base.study, attribute: {id: 'temperature', name: 'Temperature', kind: 'temperature' as const,
            unit: 'degrees-celsius' as const, method: 'thermometer' as const, precision: q(1, 2)}}};
        const signed = build({...temperature, replacement: {recordId: 'r8', value: q(-3, 2), referenceSource: 'documented-routine-value'}});
        expect(valid(signed)).toBe(true);
        expect(() => build({...temperature, replacement: {recordId: 'r8', value: q(-1, 3), referenceSource: 'documented-routine-value'}})).toThrow(GeneratorValidationError);
    });

    it('rejects malformed designated incidence/count/work links for every selected family', () => {
        const data = build(input());
        reject(data, [
            v => v.relations.push(v.relations[0]), v => v.relations[0].kind = 'task', v => v.relations = [], v => v.kind = 'other',
            v => v.relations[2].convention = 'include-center', v => v.relations[2].upperHalf.middle.positions.reverse(),
            v => v.relations[3].center = q(3), v => v.relations[3].deviations[0].subtraction.operands.reverse(),
            v => v.relations[3].deviations[0].signedDifference = q(1), v => v.relations[3].deviations[0].absoluteDifference = q(1),
            v => v.relations[3].deviations[1].recordId = v.relations[3].deviations[0].recordId,
            v => v.relations[3].absoluteDeviationSum = q(4), v => v.relations[3].quotient.result = q(3),
            v => v.relations[4].subtraction.result = q(0), v => v.relations[5].totalCount = 7,
            v => v.relations[5].classes[0].recordIds.pop(), v => v.relations[5].classes[0].count = -0,
            v => v.relations[5].classes[0].frequencyId = 'missing', v => v.relations[5].histogramMemberships[0].recordIds.push('r1'),
            v => v.relations[5].histogramMemberships[0].binId = 'missing', v => v.relations[6].enumeration[0].ordinal = 0,
            v => v.relations[6].enumeration[0].ordinal = 1.5, v => v.relations[6].enumeration[1].ordinal = 1,
            v => v.relations[6].enumeration[1].recordId = 'r1', v => v.relations[7].attributeId = 'other',
            v => v.relations[7].incidences[0].method = 'timer', v => v.relations[7].incidences[0].unitId = 'unit-9',
            v => v.relations[7].incidences[0].value = q(3), v => v.relations[7].incidences[1].recordId = 'r1',
            v => v.relations[8].gaps[1].leftFrequencyId = v.relations[8].gaps[0].leftFrequencyId,
            v => v.relations[10].facts.separations.push(v.relations[10].facts.separations[0]),
            v => v.relations[11].modifiedProofs[0].recordIds.pop(), v => v.relations[11].changes.reverse()
        ]);
    });

    it('rejects malformed builder theorem allocations and replacement descriptors', () => {
        const invalid: unknown[] = [undefined, {}, {...input(), relations: []}, {...input(), relations: ['median', 'median']},
            {...input(), relations: ['unknown']}, {...input(), replacement: undefined}, {...input(), replacement: null},
            {...input(undefined, ['median']), replacement: {recordId: 'r1', value: q(3), referenceSource: 'documented-routine-value'}},
            {...input(), replacement: {recordId: 'unknown', value: q(3), referenceSource: 'documented-routine-value'}},
            {...input(), replacement: {recordId: 'r8', value: q(15), referenceSource: 'documented-routine-value'}},
            {...input(), replacement: {recordId: 'r8', value: q(3), referenceSource: 'unknown'}}];
        for (const source of invalid) expect(() => build(source as NumericalDataBuildInput)).toThrow(GeneratorValidationError);
    });

    it('is total on hostile accessors, cycles and cheap huge sparse certificate arrays', () => {
        const data = build(input());
        const sparse: unknown[] = []; sparse.length = 2 ** 32 - 1;
        const hostile = new Proxy({}, {get() { throw new Error('hostile'); }});
        const getter = Object.defineProperty({}, 'kind', {get() { throw new Error('getter'); }});
        const cyclic: any = {}; cyclic.kind = 'interquartile-range'; cyclic.quartiles = cyclic;
        for (const candidate of [undefined, null, [], 0, {}, hostile, getter,
            {...data, relations: sparse}, {...data, relations: [cyclic]},
            mutated(data, v => v.relations[0].recordIds = sparse), mutated(data, v => v.relations[3].deviations = sparse),
            mutated(data, v => v.relations[5].classes = sparse), mutated(data, v => v.relations[11].changes = sparse)]) {
            expect(() => valid(candidate)).not.toThrow(); expect(valid(candidate)).toBe(false);
        }
    });

    it('normalizes hostile builder accessors at the public boundary and preserves typed validation failures', () => {
        const getter = Object.defineProperty({...input()}, 'relations', {get() { throw new Error('unreadable relation'); }});
        const replacement = Object.defineProperty({...input()}, 'replacement', {get() { throw new Error('unreadable replacement'); }});
        const proxy = new Proxy(input(), {get() { throw new Error('unreadable input'); }});
        const nested = {...input(), replacement: new Proxy({}, {get() { throw new Error('unreadable descriptor'); }})};
        for (const source of [getter, replacement, proxy, nested]) {
            expect(() => build(source as NumericalDataBuildInput)).toThrow(GeneratorValidationError);
        }
        const typed = new GeneratorValidationError('numerical-data', 'Existing typed failure');
        const original = Object.defineProperty({...input()}, 'relations', {get() { throw typed; }});
        expect(() => build(original)).toThrow(typed);
    });

    it('matches independent rational statistic and sensitivity oracles across translations and positive scales', () => {
        const rational = (value: NumericalDataScalar): number => value.numerator / value.denominator;
        const oracle = (values: number[]) => {
            const ordered = [...values].sort((a, b) => a - b), n = values.length;
            const middle = (list: number[]) => list.length % 2 ? list[(list.length - 1) / 2]! : (list[list.length / 2 - 1]! + list[list.length / 2]!) / 2;
            const mean = values.reduce((a, b) => a + b, 0) / n;
            return [mean, middle(ordered), values.reduce((a, b) => a + Math.abs(b - mean), 0) / n,
                middle(ordered.slice(Math.ceil(n / 2))) - middle(ordered.slice(0, Math.floor(n / 2)))];
        };
        for (const source of [[1, 2, 2, 3, 4, 6], [1, 2, 3, 4, 9], [1, 2, 4, 7]]) {
            for (const scale of [1, 2]) for (const translation of [0, 1]) {
                const values = source.map(value => value * scale + translation);
                const data = build(input(values, ['arithmetic-mean', 'median', 'mean-absolute-deviation', 'interquartile-range', 'observed-variability']));
                expect(valid(data)).toBe(true);
                const actual = (summary: NumericalDataSummaryCore) => [summary.mean, summary.median.value, summary.mad, summary.iqr].map(rational);
                actual(data.summary).forEach((value, index) => expect(value).toBeCloseTo(oracle(values)[index]!, 12));
            }
        }
    });
});
