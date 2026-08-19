import {describe, expect, it} from 'vitest';
import {
    ArithmeticOperation,
    ArithmeticPairProblem,
    ArithmeticWordProblemTwoStep
} from '../../../types/problems.ts';
import {
    getPairUnknown,
    getWordProblemStory,
    isTwoStepProblem,
    operationSymbol
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
});
