import {describe, expect, it} from 'vitest';
import {
    ArithmeticOperation,
    ArithmeticPairProblem,
    ArithmeticWordProblemRounding,
    ArithmeticWordProblemTwoStep
} from '../../../types/problems.ts';
import {
    getPairUnknown,
    getWordProblemStory,
    isTwoStepProblem,
    operationSymbol,
    resolveRoundingClaim
} from './arithmetic-word-problem-within-100-helpers.ts';

describe('operations-word-problem-within-100 helpers', () => {
    const pair: ArithmeticPairProblem = {
        num1: 34,
        num2: 18,
        operation: 'addition',
        answer: 52
    };
    const twoStep: ArithmeticWordProblemTwoStep = {
        kind: 'two-step',
        num1: 34,
        num2: 18,
        num3: 9,
        operations: ['addition', 'subtraction'],
        intermediate: 52,
        answer: 43
    };
    const rounding: ArithmeticWordProblemRounding = {
        kind: 'rounding',
        operands: [31, 27, 5],
        operations: ['addition', 'addition'],
        intermediate: 58,
        answer: 63,
        roundingPlace: 10,
        roundedAnswer: 60
    };

    it('distinguishes pair and connected two-step payloads', () => {
        expect(isTwoStepProblem(pair)).toBe(false);
        expect(isTwoStepProblem(twoStep)).toBe(true);
    });

    it('uses the view-resolved Ability to select the pair unknown', () => {
        expect(getPairUnknown(pair, false)).toBe('answer');
        expect(getPairUnknown(pair, true)).toBe('num2');
    });

    it('writes arithmetic and same-unit length stories', () => {
        expect(getWordProblemStory(pair, false, false)).toContain('books');
        expect(getWordProblemStory(pair, true, false)).toContain('cm');
        expect(getWordProblemStory(twoStep, false, false)).toContain('received');
        expect(getWordProblemStory(twoStep, false, false)).toContain('removed');
        expect(getWordProblemStory({...twoStep, operations: ['addition', 'addition'] as const}, false, false)).toContain('added');
        expect(getWordProblemStory({...twoStep, operations: ['subtraction', 'subtraction'] as const}, false, false)).toContain('removed');
        expect(getWordProblemStory({...twoStep, operations: ['multiplication', 'multiplication'] as const}, false, false)).toContain('equal groups');
        expect(getWordProblemStory({...twoStep, operations: ['division', 'division'] as const}, false, false)).toContain('shared equally');
    });

    it('uses singular nouns and verbs for one item, group, or team', () => {
        const singular = {
            ...twoStep,
            num1: 1,
            num2: 1,
            num3: 1,
            operations: ['division', 'division'] as const
        };
        expect(getWordProblemStory(singular, false, false)).toContain('1 item is shared');
        expect(getWordProblemStory(singular, false, false)).toContain('1 group');
        expect(getWordProblemStory(singular, false, false)).toContain('1 team');
    });

    it('maps every supported operation to a symbol', () => {
        const operations: ArithmeticOperation[] = ['addition', 'subtraction', 'multiplication', 'division'];
        expect(operations.map(operationSymbol))
            .toEqual(['+', '−', '×', '÷']);
    });

    it('derives deterministic reasonable and unreasonable rounding claims', () => {
        const reasonable = resolveRoundingClaim(rounding, 0);
        const unreasonable = resolveRoundingClaim(rounding, 1);

        expect(resolveRoundingClaim(rounding, 0)).toEqual(reasonable);
        expect(reasonable).toMatchObject({isReasonable: true});
        expect(reasonable.roundedProposedAnswer).toBe(rounding.roundedAnswer);
        expect(unreasonable).toMatchObject({isReasonable: false});
        expect(unreasonable.roundedProposedAnswer).not.toBe(rounding.roundedAnswer);
        expect([reasonable.proposedAnswer, unreasonable.proposedAnswer])
            .not.toContain(rounding.answer);
    });

    it.each([
        {answer: 1, roundingPlace: 10, roundedAnswer: 0},
        {answer: 5, roundingPlace: 10, roundedAnswer: 10},
        {answer: 99, roundingPlace: 10, roundedAnswer: 100},
        {answer: 999_999, roundingPlace: 100_000, roundedAnswer: 1_000_000}
    ] as const)('keeps both claim classes bounded for answer $answer', edge => {
        const edgeProblem: ArithmeticWordProblemRounding = {...rounding, ...edge};
        for (const seed of [0, 1]) {
            const claim = resolveRoundingClaim(edgeProblem, seed);
            expect(claim.proposedAnswer).toBeGreaterThan(0);
            expect(claim.proposedAnswer).toBeLessThan(10 * edge.roundingPlace);
            expect(claim.isReasonable).toBe(seed === 0);
        }
    });

    it('normalizes non-finite and signed seeds without using global randomness', () => {
        expect(resolveRoundingClaim(rounding, Number.NaN)).toEqual(
            resolveRoundingClaim(rounding, 0)
        );
        expect(resolveRoundingClaim(rounding, -3)).toEqual(
            resolveRoundingClaim(rounding, 3)
        );
    });
});
