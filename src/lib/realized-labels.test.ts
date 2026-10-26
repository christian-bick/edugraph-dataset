import {describe, expect, it} from 'vitest';
import {Ability, Area, Scope} from 'edugraph-ts/generated';
import {getRandomState, random, setRandomState} from './random.ts';
import {completeRealizedLabels, realizedLabelPolicyForPair, REALIZED_LABEL_ONTOLOGY_LABELS,
    REALIZED_LABEL_SOURCE_PATHS} from './realized-labels.ts';

const plannedLabels = [Area.Addition, Scope.IntegerNumbers, Scope.Base10,
    Scope.NumbersSmaller1000, Scope.NumbersWithoutZero, Ability.ProcedureExecution];
const pair = {operation: 'addition', num1: 6, num2: 2, answer: 8};
type CompletionInput = Parameters<typeof completeRealizedLabels>[0];
const complete = (extra: Partial<CompletionInput> = {}) => completeRealizedLabels({
    generatorId: 'arithmetic-ops-pairs', viewId: 'operations-boxes', mode: 'question',
    data: pair, plannedLabels, ...extra
});

describe('supported realized operand annotations', () => {
    it.each(['operations-boxes', 'operations-boxes-inversion', 'operations-vertical', 'operations-vertical-inversion'])(
        'annotates source operands without mistaking answer digits in %s', viewId => {
            const result = complete({viewId, data: {operation: 'addition', num1: 8, num2: 8, answer: 16}});
            expect(result.labels).toEqual([...plannedLabels, Scope.SingleDigitLargestOperand,
                Scope.SingleDigitSmallestOperand].sort());
            expect(result.receipt?.addedLabels).toEqual([Scope.SingleDigitLargestOperand,
                Scope.SingleDigitSmallestOperand]);
            expect(result.receipt?.evidence).toEqual([{facet: 'operandDigits', labels: [
                Scope.SingleDigitLargestOperand, Scope.SingleDigitSmallestOperand
            ], references: ['data.num1', 'data.num2']}]);
        });

    it('adds mixed operand digit profiles while preserving every selected claim', () => {
        const result = complete({data: {operation: 'multiplication', num1: 28, num2: 3, answer: 84}});
        expect(result.labels).toEqual([...plannedLabels, Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitLargestOperand].sort());
        expect(result.receipt?.plannedLabels).toEqual([...plannedLabels].sort());
        expect(result.receipt?.addedLabels).not.toContain(Scope.TwoDigitSmallestOperand);
    });

    it.each([
        ['arithmetic-ops-triples', {operation: 'addition', num1: 44, num2: 2, num3: 10, answer: 56},
            [Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand]],
        ['arithmetic-ops-four', {operation: 'addition', num1: 10, num2: 20, num3: 20, num4: 40, answer: 90},
            [Scope.TwoDigitLargestOperand, Scope.TwoDigitSmallestOperand]]
    ] as const)('annotates the full %s operand profile', (generatorId, data, expected) => {
        const result = complete({generatorId, data});
        expect(result.receipt?.addedLabels).toEqual(expected);
        expect(result.labels).toEqual([...plannedLabels, ...expected].sort());
    });

    it('keeps dividend and divisor facts independent of the quotient digits', () => {
        const result = complete({data: {operation: 'division', num1: 36, num2: 12, answer: 3}});
        expect(result.receipt?.addedLabels).toEqual([Scope.TwoDigitDividend, Scope.TwoDigitDivisor,
            Scope.TwoDigitLargestOperand, Scope.TwoDigitSmallestOperand]);
        expect(result.labels).not.toContain(Scope.SingleDigitDivisor);
    });

    it('uses supported broader digit profiles when no exact catalog descriptor exists', () => {
        const result = complete({data: {operation: 'division', num1: 10000, num2: 10000, answer: 1}});
        expect(result.receipt?.addedLabels).toEqual([Scope.MultipleDigitDividend, Scope.MultipleDigitDivisor,
            Scope.MultipleDigitLargestOperand, Scope.MultipleDigitSmallestOperand]);
    });
});

describe('additive realization boundaries', () => {
    it('preserves data, selected claims, ranges and random state', () => {
        const data = Object.freeze({...pair});
        const labels = Object.freeze([...plannedLabels, Scope.NumbersLarger5]);
        setRandomState(0xabc);
        const state = getRandomState();
        const result = complete({data, plannedLabels: labels});
        expect(getRandomState()).toBe(state);
        const nextRandom = random();
        setRandomState(state);
        expect(random()).toBe(nextRandom);
        expect(data).toEqual(pair);
        expect(labels).toEqual([...plannedLabels, Scope.NumbersLarger5]);
        expect(result.labels).toEqual(expect.arrayContaining([...labels]));
        expect(result.receipt?.addedLabels.every(label => REALIZED_LABEL_ONTOLOGY_LABELS.includes(
            label as typeof REALIZED_LABEL_ONTOLOGY_LABELS[number]))).toBe(true);
        expect(result.receipt?.addedLabels.some(label => /Numbers(?:Smaller|Larger)/.test(label))).toBe(false);
    });

    it('is deterministic, deduplicates labels and records only genuinely added claims', () => {
        const labels = [...plannedLabels, Scope.SingleDigitSmallestOperand, Scope.SingleDigitSmallestOperand];
        const first = complete({plannedLabels: labels});
        expect(first).toEqual(complete({plannedLabels: [...labels].reverse()}));
        expect(new Set(first.labels).size).toBe(first.labels.length);
        expect(first.receipt?.addedLabels).toEqual([Scope.SingleDigitLargestOperand]);
        expect(first.receipt?.policyHash).toMatch(/^[a-f\d]{64}$/);
        const repeated = complete({plannedLabels: first.labels});
        expect(repeated.labels).toEqual(first.labels);
        expect(repeated.receipt?.addedLabels).toEqual([]);
    });

    it.each([
        [Area.Addition], [Area.NumerationWithIntegers], [Area.Equation],
        [Area.Addition, Area.AlgebraicExpression]
    ])('accepts the agreed allowed Area context %s', (...areas) => {
        const result = complete({plannedLabels: areas});
        expect(result.receipt?.addedLabels).toEqual([Scope.NumbersWithoutZero,
            Scope.SingleDigitLargestOperand, Scope.SingleDigitSmallestOperand]);
    });

    it.each([
        [Area.Addition, Area.EquationSolving], [Area.Addition, Area.AlgebraicModeling],
        [Scope.IntegerNumbers], [Area.Addition, 'http://edugraph.io/edu/UnknownDescriptor'], [Area.Arithmetic]
    ])('leaves an outside or invalid context unchanged: %s', (...labels) => {
        const result = complete({plannedLabels: labels});
        expect(result).toEqual({labels: [...new Set(labels)].sort()});
    });

    it.each([
        ['arithmetic-ops-pairs', 'operations-word-problem'],
        ['place-value-arithmetic', 'operations-boxes'],
        ['counting-basic', 'counting-objects-simple'],
        ['unknown', 'operations-boxes']
    ])('does not annotate an unsupported pair %s / %s', (generatorId, viewId) => {
        expect(realizedLabelPolicyForPair(generatorId, viewId)).toBeNull();
        expect(complete({generatorId, viewId})).toEqual({labels: [...plannedLabels].sort()});
    });

    it.each([
        {operation: 'multiplication', num1: 0, num2: 12, answer: 0},
        {operation: 'division', num1: 0, num2: 12, answer: 0}
    ])('withholds underdetermined inversion digits in questions, but annotates their shown solution: %s', data => {
        const input = {data, viewId: 'operations-boxes-inversion'};
        const question = complete({...input, mode: 'question'});
        const solution = complete({...input, mode: 'solution'});
        expect(question.labels).toEqual([...plannedLabels].sort());
        expect(question.receipt?.addedLabels).toEqual([]);
        expect(question.receipt?.evidence).toEqual([]);
        expect(solution.receipt?.addedLabels).toEqual(expect.arrayContaining([
            Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand
        ]));
        expect(solution.receipt?.mode).toBe('solution');
    });

    it.each([
        {generatorId: 'arithmetic-ops-pairs', data: {operation: 'addition', num1: -12, num2: 7, answer: -5}},
        {generatorId: 'arithmetic-ops-triples', data: {operation: 'multiplication', num1: 2, num2: 3,
            num3: 4, answer: 14, propertyLaw: 'distributive', combinedFactor: 7, partialProducts: [6, 8]}},
        {generatorId: 'arithmetic-ops-pairs', data: {operation: 'addition', num1: 6, num2: 2, answer: 99}},
        {generatorId: 'arithmetic-ops-pairs', data: undefined}
    ])('retains unresolved or unsupported operand profiles without speculative labels: %s', extra => {
        const result = complete(extra);
        expect(result.labels).toEqual([...plannedLabels].sort());
        expect(result.receipt?.addedLabels).toEqual([]);
        expect(result.receipt?.evidence).toEqual([]);
    });

    it('exposes stable machinery inputs without claiming a range annotation policy', () => {
        expect(realizedLabelPolicyForPair('arithmetic-ops-pairs', 'operations-boxes')).toMatch(/^[a-f\d]{64}$/);
        expect(REALIZED_LABEL_SOURCE_PATHS).toContain('src/lib/realized-labels.ts');
        expect(REALIZED_LABEL_SOURCE_PATHS).toContain('src/lib/planned-generation.ts');
        expect(REALIZED_LABEL_ONTOLOGY_LABELS).toContain(Scope.TwoDigitDivisor);
        expect(REALIZED_LABEL_ONTOLOGY_LABELS.some(label => /Numbers(?:Smaller|Larger)/.test(label))).toBe(false);
    });
});

describe('narrowly reviewed zero-absence completion', () => {
    const withoutZeroClaim = plannedLabels.filter(label => label !== Scope.NumbersWithoutZero);

    it('adds zero absence only after the supported pair projection proves it', () => {
        const result = complete({plannedLabels: withoutZeroClaim});
        expect(result.labels).toEqual(expect.arrayContaining([...withoutZeroClaim, Scope.NumbersWithoutZero]));
        expect(result.receipt?.evidence).toContainEqual({facet: 'zero', labels: [Scope.NumbersWithoutZero],
            references: expect.arrayContaining(['data.num1', 'data.num2', 'data.answer'])});
        expect(result.receipt?.addedLabels).toContain(Scope.NumbersWithoutZero);
        expect(complete({plannedLabels: result.labels}).receipt?.evidence.some(item => item.facet === 'zero')).toBe(false);
    });

    it('preserves an existing contradictory zero claim without adding its complement', () => {
        const labels = [...withoutZeroClaim, Scope.NumbersWithZero];
        const result = complete({plannedLabels: labels});
        expect(result.labels).toEqual(expect.arrayContaining(labels));
        expect(result.labels).not.toContain(Scope.NumbersWithoutZero);
        expect(result.receipt?.evidence.some(item => item.facet === 'zero')).toBe(false);
    });

    it('never adds a positive zero-presence claim or removes planned claims', () => {
        const result = complete({plannedLabels: withoutZeroClaim,
            data: {operation: 'subtraction', num1: 10, num2: 10, answer: 0}});
        expect(result.labels).not.toContain(Scope.NumbersWithoutZero);
        expect(result.labels).not.toContain(Scope.NumbersWithZero);
        expect(result.labels).toEqual(expect.arrayContaining(withoutZeroClaim));
        expect(result.receipt?.evidence.some(item => item.facet === 'zero')).toBe(false);
    });

    it.each(['operations-number-line-arithmetic', 'operations-word-problem'])('keeps unreviewed %s projections unchanged', viewId => {
        expect(complete({plannedLabels: withoutZeroClaim, viewId})).toEqual({labels: [...withoutZeroClaim].sort()});
    });

    it.each([
        ['arithmetic-ops-triples', {operation: 'addition', num1: 10, num2: 20, num3: 30, answer: 60}],
        ['arithmetic-ops-four', {operation: 'addition', num1: 10, num2: 20, num3: 30, num4: 40, answer: 100}]
    ] as const)('does not widen zero completion to %s', (generatorId, data) => {
        const result = complete({plannedLabels: withoutZeroClaim, generatorId, data});
        expect(result.labels).not.toContain(Scope.NumbersWithoutZero);
        expect(result.receipt?.evidence.some(item => item.facet === 'zero')).toBe(false);
    });

    it('preserves the full Area gate for zero completion', () => {
        const labels = [...withoutZeroClaim, Area.EquationSolving];
        expect(complete({plannedLabels: labels})).toEqual({labels: [...labels].sort()});
    });

    it('leaves zero absence unresolved for an underdetermined question and a zero-valued solution', () => {
        const input = {plannedLabels: withoutZeroClaim, viewId: 'operations-boxes-inversion',
            data: {operation: 'multiplication', num1: 0, num2: 12, answer: 0}};
        for (const mode of ['question', 'solution'] as const) {
            const result = complete({...input, mode});
            expect(result.labels).not.toContain(Scope.NumbersWithoutZero);
            expect(result.labels).not.toContain(Scope.NumbersWithZero);
            expect(result.receipt?.evidence.some(item => item.facet === 'zero')).toBe(false);
        }
    });

    it('can append verified zero absence without inferring unsupported signed operand digits', () => {
        const result = complete({plannedLabels: withoutZeroClaim,
            data: {operation: 'addition', num1: -12, num2: 7, answer: -5}});
        expect(result.receipt?.addedLabels).toEqual([Scope.NumbersWithoutZero]);
        expect(result.receipt?.evidence.map(item => item.facet)).toEqual(['zero']);
    });
});
