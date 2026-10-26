import {describe, expect, it} from 'vitest';
import {Ability, Scope} from 'edugraph-ts/generated';
import {
    assessLabelDependencyEvidence,
    hasLabelDependencyEvidenceAdapter,
    LABEL_DEPENDENCY_EVIDENCE_VERSION,
    type LabelDependencyEvidenceInput
} from './label-dependency-evidence.ts';

const pair = {num1: 6, num2: 2, answer: 8, operation: 'addition'};
const arithmetic = (data: unknown = pair, extra: Partial<LabelDependencyEvidenceInput> = {}) =>
    assessLabelDependencyEvidence({generatorId: 'arithmetic-ops-pairs', viewId: 'operations-boxes',
        mode: 'question', data, ...extra});
const counting = (viewId = 'counting-objects-simple', data: unknown = {numObjects: 7, simpleAnswer: 7},
    extra: Partial<LabelDependencyEvidenceInput> = {}) =>
    assessLabelDependencyEvidence({generatorId: 'counting-basic', viewId, mode: 'question', data, ...extra});

describe('label dependency evidence registry', () => {
    it('registers only explicitly reviewed producer/view combinations', () => {
        expect(LABEL_DEPENDENCY_EVIDENCE_VERSION).toBe(2);
        for (const producer of ['arithmetic-ops-pairs', 'arithmetic-ops-triples', 'arithmetic-ops-four']) {
            for (const view of ['operations-boxes', 'operations-boxes-inversion', 'operations-vertical', 'operations-vertical-inversion']) {
                expect(hasLabelDependencyEvidenceAdapter(producer, view)).toBe(true);
            }
        }
        expect(hasLabelDependencyEvidenceAdapter('counting-basic', 'counting-conservation')).toBe(true);
        expect(hasLabelDependencyEvidenceAdapter('counting-selection', 'counting-objects-count-out')).toBe(true);
        expect(hasLabelDependencyEvidenceAdapter('counting-basic', 'counting-objects-count-out')).toBe(false);
        expect(hasLabelDependencyEvidenceAdapter('new-producer', 'operations-boxes')).toBe(false);
        expect(hasLabelDependencyEvidenceAdapter('arithmetic-ops-pairs', 'operations-word-problem')).toBe(false);
        expect(hasLabelDependencyEvidenceAdapter('arithmetic-ops-pairs', 'operations-boxes-new')).toBe(false);
    });

    it('reports uncovered and unavailable evidence as unresolved, never inapplicable', () => {
        for (const result of [arithmetic(pair, {data: undefined}), arithmetic(pair, {viewId: 'unknown'}),
            counting('counting-conservation', undefined, {data: undefined})]) {
            expect(Object.values(result.triggers).every(evidence => evidence.status === 'unresolved')).toBe(true);
            expect(Object.values(result.facets).every(evidence => evidence.status === 'unresolved')).toBe(true);
            expect(result.facets).not.toHaveProperty('range');
        }
        expect(arithmetic(pair, {viewId: 'unknown'}).adapter).toBe('uncovered');
    });
});

describe('integer arithmetic evidence', () => {
    it.each(['question', 'solution'] as const)('establishes numeric facts without label input in %s mode', mode => {
        const result = arithmetic(pair, {mode});
        expect(result.adapter).toBe('integer-arithmetic-v1');
        expect(result.triggers.numericTask?.status).toBe('present');
        expect(result.triggers.arithmeticOperands?.status).toBe('present');
        expect(result.facets.numberKind.expectedLabels).toEqual([Scope.IntegerNumbers]);
        expect(result.facets.numeralSystem.expectedLabels).toEqual([Scope.ArabicNumerals]);
        expect(result.facets.base.expectedLabels).toEqual([Scope.Base10]);
        expect(result.facets.sign.expectedLabels).toEqual([Scope.NumbersWithoutNegatives]);
        expect(result.facets.zero.expectedLabels).toEqual([Scope.NumbersWithoutZero]);
        expect(result.facets.operandCount.expectedLabels).toEqual([Scope.TwoOperands]);
        expect(result.facets.operandDigits.expectedLabels).toEqual([
            Scope.SingleDigitLargestOperand, Scope.SingleDigitSmallestOperand
        ]);
        expect(result.triggers.fractionValues?.status).toBe('absent');
        expect(result.triggers.decimalRepresentation?.status).toBe('absent');
        expect(result.triggers.writtenExplanation?.status).toBe('absent');
        expect(result.facets.referenceFrames.status).toBe('unresolved');
    });

    it('distinguishes operand digits from answer digits and repeated occurrences', () => {
        const result = arithmetic({num1: 8, num2: 8, answer: 16, operation: 'addition'});
        expect(result.facets.operandDigits.expectedLabels).toEqual([
            Scope.SingleDigitLargestOperand, Scope.SingleDigitSmallestOperand
        ]);
        expect(result.facets.operandCount.expectedLabels).toEqual([Scope.TwoOperands]);
        expect(arithmetic({num1: 28, num2: 3, answer: 84, operation: 'multiplication'})
            .facets.operandDigits.expectedLabels).toEqual([Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand]);
    });

    it('finds negative and zero quantities, including prescribed intermediates', () => {
        const negative = arithmetic({num1: -12, num2: 7, answer: -5, operation: 'addition'});
        expect(negative.facets.sign.expectedLabels).toEqual([Scope.NumbersWithNegatives]);
        expect(negative.facets.operandDigits.status).toBe('unresolved');
        const zero = arithmetic({num1: 10, num2: 10, answer: 0, operation: 'subtraction'});
        expect(zero.facets.zero.expectedLabels).toEqual([Scope.NumbersWithZero]);
        const triple = arithmetic({num1: 3, num2: 3, num3: 2, answer: -2, operation: 'subtraction'},
            {generatorId: 'arithmetic-ops-triples'});
        expect(triple.facets.zero.expectedLabels).toEqual([Scope.NumbersWithZero]);
        expect(triple.facets.sign.expectedLabels).toEqual([Scope.NumbersWithNegatives]);
        expect(triple.facets.operandCount.expectedLabels).toEqual([Scope.ThreeOperands]);
    });

    it('does not mistake a zero digit for the value zero', () => {
        expect(arithmetic({num1: 10, num2: 20, answer: 30, operation: 'addition'})
            .facets.zero.expectedLabels).toEqual([Scope.NumbersWithoutZero]);
    });

    it('supports four operands and exact/dividend/divisor digit profiles', () => {
        const four = arithmetic({num1: 10, num2: 20, num3: 20, num4: 40, answer: 90, operation: 'addition'},
            {generatorId: 'arithmetic-ops-four', viewId: 'operations-vertical'});
        expect(four.facets.operandCount.expectedLabels).toEqual([Scope.FourOperands]);
        expect(four.facets.operandDigits.expectedLabels).toEqual([Scope.TwoDigitLargestOperand, Scope.TwoDigitSmallestOperand]);
        const division = arithmetic({num1: 1000, num2: 10, answer: 100, operation: 'division'});
        expect(division.facets.operandDigits.expectedLabels).toEqual(expect.arrayContaining([
            Scope.FourDigitLargestOperand, Scope.FourDigitDividend, Scope.TwoDigitSmallestOperand, Scope.TwoDigitDivisor
        ]));
        const triple = arithmetic({num1: 2000, num2: 10, num3: 20, answer: 10, operation: 'division'},
            {generatorId: 'arithmetic-ops-triples'});
        expect(triple.facets.operandDigits.expectedLabels?.filter(label => label === Scope.TwoDigitDivisor)).toHaveLength(1);
        expect(arithmetic({num1: 443, num2: 353, answer: 796, operation: 'addition'})
            .facets.operandDigits.expectedLabels).toEqual([Scope.ThreeDigitLargestOperand, Scope.ThreeDigitSmallestOperand]);
    });

    it('uses truthful broader catalog labels when exact digit descriptors do not exist', () => {
        const result = arithmetic({num1: 10000, num2: 10000, answer: 1, operation: 'division'});
        expect(result.facets.operandDigits.expectedLabels).toEqual(expect.arrayContaining([
            Scope.MultipleDigitLargestOperand, Scope.MultipleDigitSmallestOperand,
            Scope.MultipleDigitDividend, Scope.MultipleDigitDivisor
        ]));
    });

    it('does not use an arbitrary hidden value to resolve an underdetermined inversion', () => {
        const data = {num1: 0, num2: 12, answer: 0, operation: 'multiplication'};
        const question = arithmetic(data, {viewId: 'operations-boxes-inversion'});
        expect(question.facets.operandDigits.status).toBe('unresolved');
        expect(question.facets.sign.status).toBe('unresolved');
        expect(question.facets.operandCount.expectedLabels).toEqual([Scope.TwoOperands]);
        expect(arithmetic(data, {viewId: 'operations-boxes-inversion', mode: 'solution'})
            .facets.zero.expectedLabels).toEqual([Scope.NumbersWithZero]);
        expect(arithmetic({num1: 0, num2: 2, answer: 0, operation: 'division'},
            {viewId: 'operations-vertical-inversion'}).facets.zero.status).toBe('unresolved');
    });

    it.each([
        null, [], {}, {...pair, operation: 'power'}, {...pair, num1: NaN}, {...pair, num1: 1.5},
        {...pair, answer: 9}, {...pair, num1: Number.MAX_SAFE_INTEGER + 1}, {...pair, num3: 2},
        {...pair, blankPart: 'num1'}, {...pair, layoutNumber: 100}, {...pair, combinedFactor: 8},
        {...pair, propertyLaw: 'commutative'},
        {num1: 2, num2: 0, answer: 0, operation: 'division'},
        {num1: 10, num2: 3, answer: 3, operation: 'division'}
    ])('keeps malformed or unsupported arithmetic payloads unresolved: %j', data => {
        const result = arithmetic(data);
        expect(result.triggers.numericTask?.status).toBe('unresolved');
        expect(result.facets.numberKind.status).toBe('unresolved');
    });
});

describe('property-law expression evidence', () => {
    const laws = [
        {num1: 2, num2: 3, num3: 4, answer: 9, operation: 'addition', propertyLaw: 'commutative'},
        {num1: 2, num2: 3, num3: 4, answer: 24, operation: 'multiplication', propertyLaw: 'commutative'},
        {num1: 2, num2: 3, num3: 4, answer: 9, operation: 'addition', propertyLaw: 'associative'},
        {num1: 2, num2: 3, num3: 4, answer: 24, operation: 'multiplication', propertyLaw: 'associative'},
        {num1: 2, num2: 3, num3: 4, answer: 14, operation: 'multiplication', propertyLaw: 'distributive',
            combinedFactor: 7, partialProducts: [6, 8]}
    ];
    const witness = (data: unknown, extra: Partial<LabelDependencyEvidenceInput> = {}) =>
        arithmetic(data, {generatorId: 'arithmetic-ops-triples', ...extra});

    it.each(laws.flatMap(data => ['question', 'solution'].flatMap(mode =>
        ['operations-boxes', 'operations-vertical', 'operations-boxes-inversion', 'operations-vertical-inversion']
            .map(viewId => ({data, mode: mode as 'question' | 'solution', viewId})))))(
        'assesses $data.propertyLaw $data.operation in $viewId / $mode', ({data, mode, viewId}) => {
            const result = witness(data, {mode, viewId});
            expect(result.facets.numberKind.expectedLabels).toEqual([Scope.IntegerNumbers]);
            expect(result.facets.sign.expectedLabels).toEqual([Scope.NumbersWithoutNegatives]);
            expect(result.facets.zero.expectedLabels).toEqual([Scope.NumbersWithoutZero]);
            expect(result.facets.operandCount.expectedLabels).toEqual(data.propertyLaw === 'distributive'
                ? [Scope.TwoOperands, Scope.ThreeOperands, Scope.FourOperands] : [Scope.ThreeOperands]);
            expect(result.facets.operandDigits.expectedLabels).toEqual([
                Scope.SingleDigitLargestOperand, Scope.SingleDigitSmallestOperand]);
            expect(result.triggers.fractionValues?.status).toBe('absent');
            expect(result.triggers.decimalRepresentation?.status).toBe('absent');
            expect(result.triggers.writtenExplanation?.status).toBe('absent');
            expect(result.facets).not.toHaveProperty('range');
        });

    it('uses the distributive sum and partial products instead of a left-associated triple product', () => {
        const result = witness({num1: 4, num2: 8, num3: 9, answer: 68, operation: 'multiplication',
            propertyLaw: 'distributive', combinedFactor: 17, partialProducts: [32, 36]});
        expect(result.facets.operandDigits.expectedLabels).toEqual([
            Scope.SingleDigitLargestOperand, Scope.SingleDigitSmallestOperand,
            Scope.TwoDigitLargestOperand, Scope.TwoDigitSmallestOperand]);
        expect(result.facets.numberKind.references).toEqual([
            'data.num1', 'data.num2', 'data.num3', 'data.combinedFactor',
            'data.partialProducts[0]', 'data.partialProducts[1]', 'data.answer']);
        expect(result.facets.operandDigits.references).toContain('data.partialProducts[0]');
    });

    it('includes both associative group results without treating them as extra explicit operands', () => {
        const result = witness({num1: 1, num2: -1, num3: 2, answer: 2,
            operation: 'addition', propertyLaw: 'associative'});
        expect(result.facets.zero.expectedLabels).toEqual([Scope.NumbersWithZero]);
        expect(result.facets.sign.expectedLabels).toEqual([Scope.NumbersWithNegatives]);
        expect(result.facets.operandDigits.status).toBe('unresolved');
        expect(result.facets.operandCount.expectedLabels).toEqual([Scope.ThreeOperands]);
    });

    it('does not invent an unshown commutative grouping or use answer digits as operand digits', () => {
        const result = witness({num1: 0, num2: Number.MAX_SAFE_INTEGER, num3: Number.MAX_SAFE_INTEGER,
            answer: 0, operation: 'multiplication', propertyLaw: 'commutative'}, {mode: 'solution'});
        expect(result.facets.numberKind.expectedLabels).toEqual([Scope.IntegerNumbers]);
        expect(result.facets.zero.expectedLabels).toEqual([Scope.NumbersWithZero]);
        expect(result.facets.operandDigits.expectedLabels).toEqual([
            Scope.MultipleDigitLargestOperand, Scope.SingleDigitSmallestOperand]);
        const addition = witness({num1: 8, num2: 8, num3: 8, answer: 24,
            operation: 'addition', propertyLaw: 'associative'});
        expect(addition.facets.operandDigits.expectedLabels).not.toContain(Scope.TwoDigitLargestOperand);
    });

    it.each([
        {num1: 0, num2: 12, num3: 3, answer: 0, operation: 'multiplication', propertyLaw: 'commutative'},
        {num1: 3, num2: 12, num3: 0, answer: 0, operation: 'multiplication', propertyLaw: 'associative'},
        {num1: 0, num2: 12, num3: 3, answer: 0, operation: 'multiplication', propertyLaw: 'distributive',
            combinedFactor: 15, partialProducts: [0, 0]}
    ])('preserves mode-specific observability for an underdetermined $propertyLaw inversion', data => {
        const question = witness(data, {viewId: 'operations-boxes-inversion'});
        for (const facet of ['numberKind', 'sign', 'zero', 'operandDigits']) {
            expect(question.facets[facet].status).toBe('unresolved');
        }
        expect(question.facets.operandCount.status).toBe('applicable');
        const solution = witness(data, {viewId: 'operations-boxes-inversion', mode: 'solution'});
        expect(solution.facets.operandDigits.status).toBe('applicable');
        expect(solution.facets.zero.expectedLabels).toEqual([Scope.NumbersWithZero]);
    });

    it('can determine a blank distributive addend even when the other addend is zero', () => {
        const result = witness({num1: 2, num2: 7, num3: 0, answer: 14, operation: 'multiplication',
            propertyLaw: 'distributive', combinedFactor: 7, partialProducts: [14, 0]},
        {viewId: 'operations-vertical-inversion'});
        expect(result.facets.zero.expectedLabels).toEqual([Scope.NumbersWithZero]);
        expect(result.facets.operandDigits.status).toBe('applicable');
    });

    it.each([
        {...laws[0], propertyLaw: 'unrecognized'}, {...laws[0], propertyLaw: {toString: (): string => 'commutative'}},
        {...laws[0], operation: 'subtraction'}, {...laws[0], operation: 'division'},
        {...laws[0], answer: 10}, {...laws[0], combinedFactor: 7}, {...laws[0], partialProducts: [6, 8]},
        {...laws[4], operation: 'addition'}, {...laws[4], combinedFactor: undefined},
        {...laws[4], combinedFactor: 8}, {...laws[4], partialProducts: undefined},
        {...laws[4], partialProducts: '6,8'}, {...laws[4], partialProducts: [6]},
        {...laws[4], partialProducts: [7, 7]}, {...laws[4], answer: 24},
        {...laws[4], num2: Number.MAX_SAFE_INTEGER, num3: Number.MAX_SAFE_INTEGER},
        {...laws[4], num1: Number.MAX_SAFE_INTEGER, num2: 2, num3: 3,
            combinedFactor: 5, partialProducts: [Number.MAX_SAFE_INTEGER * 2, Number.MAX_SAFE_INTEGER * 3],
            answer: Number.MAX_SAFE_INTEGER * 5},
        {num1: 0, num2: Number.MAX_SAFE_INTEGER, num3: Number.MAX_SAFE_INTEGER,
            answer: 0, operation: 'multiplication', propertyLaw: 'associative'}
    ])('leaves malformed, unsupported or unsafe witnesses unresolved: %j', data => {
        const result = witness(data);
        expect(result.triggers.numericTask?.status).toBe('unresolved');
        expect(result.facets.operandCount.status).toBe('unresolved');
    });

    it('does not mutate a property witness or its partial-product array', () => {
        const products = Object.freeze([6, 8]);
        const data = Object.freeze({...laws[4], partialProducts: products});
        expect(witness(data)).toEqual(witness(data));
        expect(products).toEqual([6, 8]);
    });
});

describe('object counting evidence', () => {
    it.each(['question', 'solution'] as const)('keeps conservation numeral/base facets inapplicable in %s mode', mode => {
        const result = counting('counting-conservation', {numObjects: 8, simpleAnswer: 8}, {mode});
        expect(result.triggers.numericTask?.status).toBe('present');
        expect(result.triggers.arithmeticOperands?.status).toBe('absent');
        expect(result.facets.numberKind.expectedLabels).toEqual([Scope.IntegerNumbers]);
        expect(result.facets.numeralSystem.status).toBe('not_applicable');
        expect(result.facets.base.status).toBe('not_applicable');
        expect(result.facets.base.references).toEqual([`view:counting-conservation:${mode}`]);
        expect(result.facets.zero.expectedLabels).toEqual([Scope.NumbersWithoutZero]);
    });

    it.each(['counting-objects-simple', 'counting-objects-one-to-one', 'counting-objects-cardinality'])(
        'supports explicit numeral response evidence in %s', view => {
            const result = counting(view);
            expect(result.facets.numeralSystem.expectedLabels).toEqual([Scope.ArabicNumerals]);
            expect(result.facets.base.expectedLabels).toEqual([Scope.Base10]);
        });

    it('assesses explicit written explanation in both modes', () => {
        for (const mode of ['question', 'solution'] as const) {
            const result = counting('counting-objects-simple', {numObjects: 0, simpleAnswer: 0}, {mode});
            expect(result.triggers.writtenExplanation?.status).toBe('present');
            expect(result.facets.articulation.expectedLabels).toEqual([Ability.TextualArticulation]);
            expect(result.facets.zero.expectedLabels).toEqual([Scope.NumbersWithZero]);
        }
    });

    it('checks selection supply and the requested subset without counting arbitrary fields', () => {
        const result = counting('counting-objects-count-out', {numObjects: 7, availableCount: 20, simpleAnswer: 7},
            {generatorId: 'counting-selection'});
        expect(result.adapter).toBe('count-out-v1');
        expect(result.triggers.numericTask?.references).toEqual(['data.numObjects', 'data.availableCount']);
        expect(result.facets.sign.expectedLabels).toEqual([Scope.NumbersWithoutNegatives]);
        expect(result.facets.zero.expectedLabels).toEqual([Scope.NumbersWithoutZero]);
        expect(result.facets).not.toHaveProperty('range');
    });

    it('includes parity grouping outcomes and validates the view-specific contract', () => {
        const even = counting('counting-objects-parity', {numObjects: 4, simpleAnswer: 4, parity: 'even'});
        expect(even.facets.zero.expectedLabels).toEqual([Scope.NumbersWithZero]);
        expect(counting('counting-objects-parity', {numObjects: 3, simpleAnswer: 3, parity: 'odd'})
            .facets.zero.expectedLabels).toEqual([Scope.NumbersWithoutZero]);
        for (const data of [{numObjects: 4, simpleAnswer: 4}, {numObjects: 0, simpleAnswer: 0, parity: 'even'},
            {numObjects: 22, simpleAnswer: 22, parity: 'even'}]) {
            expect(counting('counting-objects-parity', data).triggers.numericTask?.status).toBe('unresolved');
        }
    });

    it.each([null, [], {}, {numObjects: -1, simpleAnswer: -1}, {numObjects: 1.5, simpleAnswer: 1.5},
        {numObjects: 4, simpleAnswer: 3}, {numObjects: 4, simpleAnswer: 4, parity: 'odd'},
        {numObjects: 4, simpleAnswer: 4, hiddenNumber: 0}])('keeps invalid counting data unresolved: %j', data => {
        const result = counting('counting-conservation', data);
        expect(result.triggers.numericTask?.status).toBe('unresolved');
        expect(result.facets.base.status).toBe('unresolved');
    });

    it.each([{numObjects: 0, simpleAnswer: 0, availableCount: 4}, {numObjects: 5, simpleAnswer: 5, availableCount: 4},
        {numObjects: 4, simpleAnswer: 4}, {numObjects: 4, simpleAnswer: 4, availableCount: Infinity}])(
        'rejects an unsupported count-out shape: %j', data => {
            expect(counting('counting-objects-count-out', data, {generatorId: 'counting-selection'})
                .facets.numberKind.status).toBe('unresolved');
        });

    it('is deterministic and leaves the typed input untouched', () => {
        const input = Object.freeze({generatorId: 'arithmetic-ops-pairs', viewId: 'operations-boxes',
            mode: 'question' as const, data: Object.freeze({...pair})});
        expect(assessLabelDependencyEvidence(input)).toEqual(assessLabelDependencyEvidence(input));
        expect(input.data).toEqual(pair);
    });
});
