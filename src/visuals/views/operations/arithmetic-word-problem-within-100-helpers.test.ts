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
        numberDomain: {min: 1, max: 1000},
        operands: [31, 27, 5],
        operations: ['addition', 'addition'],
        intermediate: 58,
        answer: 63,
        roundingPlace: 10,
        roundedAnswer: 60,
        proposal: {proposedAnswer: 64, roundedProposedAnswer: 60}
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

    it.each([
        {
            data: {num1: 90, num2: 45, operation: 'division', answer: 2},
            story: '90 items are shared equally among 45 groups. How many items are in each group?'
        },
        {
            data: {num1: 3, num2: 7, operation: 'multiplication', answer: 21},
            story: 'There are 3 equal groups with 7 items in each group. How many items are there altogether?'
        }
    ] as const)('asks for the quantity computed by $data.operation', ({data, story}) => {
        expect(getWordProblemStory(data, false, false)).toBe(story);
    });

    it.each([
        {
            data: {num1: 90, num2: 45, operation: 'division', answer: 2},
            story: '90 items are shared equally among an unknown number of groups. There are 2 items in each group.'
        },
        {
            data: {num1: 3, num2: 7, operation: 'multiplication', answer: 21},
            story: 'There are 3 equal groups with an unknown number of items in each group. There are 21 items altogether.'
        }
    ] as const)('preserves the known result and unknown input in inverted $data.operation', ({data, story}) => {
        expect(getWordProblemStory(data, false, true)).toBe(story);
    });

    it.each([
        {
            data: {num1: 82, num2: 82, operation: 'division', answer: 1},
            inverted: true,
            story: '82 items are shared equally among an unknown number of groups. There is 1 item in each group.'
        },
        {
            data: {num1: 1, num2: 1, operation: 'division', answer: 1},
            inverted: false,
            story: '1 item is shared equally among 1 group. How many items are in each group?'
        },
        {
            data: {num1: 2, num2: 1, operation: 'division', answer: 2},
            inverted: false,
            story: '2 items are shared equally among 1 group. How many items are in each group?'
        },
        {
            data: {num1: 1, num2: 1, operation: 'multiplication', answer: 1},
            inverted: false,
            story: 'There is 1 equal group with 1 item in each group. How many items are there altogether?'
        },
        {
            data: {num1: 2, num2: 1, operation: 'multiplication', answer: 2},
            inverted: false,
            story: 'There are 2 equal groups with 1 item in each group. How many items are there altogether?'
        },
        {
            data: {num1: 1, num2: 2, operation: 'multiplication', answer: 2},
            inverted: false,
            story: 'There is 1 equal group with 2 items in each group. How many items are there altogether?'
        },
        {
            data: {num1: 1, num2: 1, operation: 'multiplication', answer: 1},
            inverted: true,
            story: 'There is 1 equal group with an unknown number of items in each group. There is 1 item altogether.'
        }
    ] as const)('agrees with singular and plural quantities in $data.operation (inverted: $inverted)', ({data, inverted, story}) => {
        expect(getWordProblemStory(data, false, inverted)).toBe(story);
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

    it('evaluates canonical proposals without selecting or mutating their mathematics', () => {
        const before = structuredClone(rounding);
        expect(resolveRoundingClaim(rounding)).toEqual({...rounding.proposal, isReasonable: true});
        expect(resolveRoundingClaim({...rounding, proposal: {proposedAnswer: 74, roundedProposedAnswer: 70}}))
            .toEqual({proposedAnswer: 74, roundedProposedAnswer: 70, isReasonable: false});
        expect(rounding).toEqual(before);
    });

    it('keeps the original upper-bound example valid without inventing the infeasible class', () => {
        const edge: ArithmeticWordProblemRounding = {...rounding, numberDomain: {min: 1, max: 100},
            operands: [23, 32, 45], intermediate: 55, answer: 100, roundingPlace: 100, roundedAnswer: 100,
            proposal: {proposedAnswer: 99, roundedProposedAnswer: 100}};
        expect(resolveRoundingClaim(edge).isReasonable).toBe(true);
        for (const proposal of [{proposedAnswer: 200, roundedProposedAnswer: 200},
            {proposedAnswer: 1, roundedProposedAnswer: 0}, {proposedAnswer: 100, roundedProposedAnswer: 100}]) {
            expect(() => resolveRoundingClaim({...edge, proposal})).toThrow('canonical bounded proposal');
        }
    });

    it('accepts the declared million boundary and positive lower bound', () => {
        const large: ArithmeticWordProblemRounding = {...rounding, numberDomain: {min: 1, max: 1_000_000},
            operands: [333333, 333333, 333333], intermediate: 666666, answer: 999999,
            roundingPlace: 100000, roundedAnswer: 1000000,
            proposal: {proposedAnswer: 999998, roundedProposedAnswer: 1000000}};
        expect(resolveRoundingClaim(large).isReasonable).toBe(true);
        expect(resolveRoundingClaim({...rounding, numberDomain: {min: 5, max: 70},
            proposal: {proposedAnswer: 5, roundedProposedAnswer: 10}}).isReasonable).toBe(false);
    });

    it.each([undefined, {min: 0, max: 1000}, {min: 1, max: 1000001}, {min: 10, max: 9},
        {min: 1.5, max: 1000}, {min: 1, max: Infinity}])('rejects invalid number domain %j', numberDomain => {
        expect(() => resolveRoundingClaim({...rounding, numberDomain} as ArithmeticWordProblemRounding))
            .toThrow('positive-integer rounding domain');
    });

    it.each([{operands: [31, 27]}, {operands: [0, 27, 5]}, {intermediate: 1001}, {answer: 0},
        {roundedAnswer: 70}, {roundingPlace: 5}])('rejects out-of-domain or inconsistent base evidence %j', change => {
        expect(() => resolveRoundingClaim({...rounding, ...change} as ArithmeticWordProblemRounding))
            .toThrow('exact and rounded quantities');
    });

    it.each([undefined, {proposedAnswer: 0, roundedProposedAnswer: 0},
        {proposedAnswer: 1001, roundedProposedAnswer: 1000}, {proposedAnswer: 1.5, roundedProposedAnswer: 0},
        {proposedAnswer: 64, roundedProposedAnswer: 70}, {proposedAnswer: 63, roundedProposedAnswer: 60},
        {proposedAnswer: 64, roundedProposedAnswer: 60, isReasonable: true}])('rejects invalid canonical proposal %j', proposal => {
        expect(() => resolveRoundingClaim({...rounding, proposal} as ArithmeticWordProblemRounding))
            .toThrow('canonical bounded proposal');
    });
});
