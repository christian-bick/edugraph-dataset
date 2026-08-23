import {describe, expect, it} from 'vitest';
import {
    IntegerAddSubtractStrategyProblem,
    IntegerAddSubtractStrategyStep
} from '../../../types/problems.ts';
import {
    formatOperationRelationship,
    getIntegerAddSubtractStrategyPresentation,
    isCountingRelationStrategy,
    isValidIntegerAddSubtractStrategyProblem,
    maskEquationResult,
    validateCountingRelationStrategy
} from './operations-add-subtract-strategy-helpers.ts';

const operation = (
    operationType: 'addition' | 'subtraction',
    leftOperand: number,
    rightOperand: number,
    result: number
): IntegerAddSubtractStrategyStep => ({
    kind: 'operation',
    operation: operationType,
    leftOperand,
    rightOperand,
    result
});

const decomposition = (
    whole: number,
    firstPart: number,
    secondPart: number
): IntegerAddSubtractStrategyStep => ({
    kind: 'decomposition',
    whole,
    parts: [firstPart, secondPart]
});

const problems: IntegerAddSubtractStrategyProblem[] = [{
    task: 'integer-add-subtract-strategy',
    strategy: 'addition-compensation',
    operation: 'addition',
    leftOperand: 246,
    rightOperand: 178,
    answer: 424,
    adjustment: 2,
    steps: [
        operation('subtraction', 246, 2, 244),
        operation('addition', 178, 2, 180),
        operation('addition', 244, 180, 424)
    ]
}, {
    task: 'integer-add-subtract-strategy',
    strategy: 'subtraction-compensation',
    operation: 'subtraction',
    leftOperand: 643,
    rightOperand: 278,
    answer: 365,
    adjustment: 2,
    steps: [
        operation('addition', 278, 2, 280),
        operation('addition', 643, 2, 645),
        operation('subtraction', 645, 280, 365)
    ]
}, {
    task: 'integer-add-subtract-strategy',
    strategy: 'subtraction-think-addition',
    operation: 'subtraction',
    leftOperand: 620,
    rightOperand: 303,
    answer: 317,
    adjustment: 7,
    steps: [
        operation('addition', 303, 7, 310),
        operation('addition', 310, 310, 620),
        operation('addition', 7, 310, 317)
    ]
}, {
    task: 'integer-add-subtract-strategy',
    strategy: 'subtraction-make-ten',
    operation: 'subtraction',
    leftOperand: 13,
    rightOperand: 5,
    answer: 8,
    adjustment: 3,
    steps: [
        decomposition(5, 3, 2),
        operation('subtraction', 13, 3, 10),
        operation('subtraction', 10, 2, 8)
    ]
}, {
    task: 'integer-add-subtract-strategy',
    strategy: 'addition-counting-on',
    operation: 'addition',
    leftOperand: 7,
    rightOperand: 3,
    answer: 10,
    adjustment: 3,
    steps: [
        operation('addition', 7, 1, 8),
        operation('addition', 8, 1, 9),
        operation('addition', 9, 1, 10)
    ]
}, {
    task: 'integer-add-subtract-strategy',
    strategy: 'subtraction-counting-back',
    operation: 'subtraction',
    leftOperand: 9,
    rightOperand: 2,
    answer: 7,
    adjustment: 2,
    steps: [
        operation('subtraction', 9, 1, 8),
        operation('subtraction', 8, 1, 7)
    ]
}, {
    task: 'integer-add-subtract-strategy',
    strategy: 'addition-make-ten',
    operation: 'addition',
    leftOperand: 8,
    rightOperand: 5,
    answer: 13,
    adjustment: 2,
    steps: [
        decomposition(5, 2, 3),
        operation('addition', 8, 2, 10),
        operation('addition', 10, 3, 13)
    ]
}, {
    task: 'integer-add-subtract-strategy',
    strategy: 'addition-near-doubles',
    operation: 'addition',
    leftOperand: 6,
    rightOperand: 7,
    answer: 13,
    adjustment: 1,
    steps: [
        operation('addition', 6, 6, 12),
        operation('addition', 12, 1, 13)
    ]
}];

describe('operations add/subtract strategy helpers', () => {
    it('accepts every exact typed strategy witness', () => {
        for (const problem of problems) {
            expect(isValidIntegerAddSubtractStrategyProblem(problem)).toBe(true);
        }
    });

    it('derives equations and language without generator-authored prose', () => {
        const compensation = getIntegerAddSubtractStrategyPresentation(problems[0]!);
        expect(compensation).toEqual({
            prompt: 'Use compensation to solve 246 + 178 = ?',
            questionEquation: '246 + 178 = ?',
            solutionEquation: '246 + 178 = 424',
            transformedEquation: '246 + 178 = 244 + 180',
            steps: ['246 − 2 = 244', '178 + 2 = 180', '244 + 180 = 424'],
            explanation: 'Move 2 from 246 to 178. This keeps the sum unchanged and creates the friendly addend 180.'
        });
        expect(getIntegerAddSubtractStrategyPresentation(problems[6]!).steps[0])
            .toBe('5 = 2 + 3');
        expect(maskEquationResult(compensation.steps[2]!)).toBe('244 + 180 = ?');
        expect(maskEquationResult('16 = 6 + 10')).toBe('16 = 6 + ?');
    });

    it('formats and restricts counting-operation derivation', () => {
        const countingOn = problems[4]!;
        const countingBack = problems[5]!;
        expect(formatOperationRelationship(countingOn, false)).toBe('7 □ 3 = 10');
        expect(formatOperationRelationship(countingOn, true)).toBe('7 + 3 = 10');
        expect(formatOperationRelationship(countingBack, true)).toBe('9 − 2 = 7');
        expect(isCountingRelationStrategy(countingOn.strategy)).toBe(true);
        expect(isCountingRelationStrategy(countingBack.strategy)).toBe(true);
        expect(isCountingRelationStrategy(problems[6]!.strategy)).toBe(false);
        expect(validateCountingRelationStrategy(countingOn.strategy, 'counting-on-view'))
            .toBe('addition-counting-on');
        expect(() => validateCountingRelationStrategy(
            problems[6]!.strategy,
            'counting-on-view'
        )).toThrow('supports only counting-on and counting-back relationships');
    });

    it('rejects incorrect results, adjustments, and typed steps', () => {
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...problems[0]!,
            adjustment: 3
        })).toBe(false);
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...problems[0]!,
            answer: 425
        })).toBe(false);
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...problems[3]!,
            steps: [
                decomposition(5, 4, 1),
                ...problems[3]!.steps.slice(1)
            ]
        })).toBe(false);
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...problems[4]!,
            steps: 3 as unknown as readonly IntegerAddSubtractStrategyStep[]
        })).toBe(false);
    });
});
