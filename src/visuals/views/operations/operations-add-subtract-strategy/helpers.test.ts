import {describe, expect, it} from 'vitest';
import {IntegerAddSubtractStrategyProblem} from '../../../../types/problems.ts';
import {
    formatOperationRelationship,
    isCountingRelationStrategy,
    isValidIntegerAddSubtractStrategyProblem,
    maskEquationResult,
    validateCountingRelationStrategy
} from './helpers.ts';

const additionProblem: IntegerAddSubtractStrategyProblem = {
    task: 'integer-add-subtract-strategy',
    strategy: 'addition-compensation',
    operation: 'addition',
    leftOperand: 246,
    rightOperand: 178,
    answer: 424,
    adjustment: 2,
    prompt: 'Use compensation to solve 246 + 178 = ?',
    questionEquation: '246 + 178 = ?',
    solutionEquation: '246 + 178 = 424',
    transformedEquation: '246 + 178 = 244 + 180',
    steps: ['246 − 2 = 244', '178 + 2 = 180', '244 + 180 = 424'],
    explanation: 'Move 2 from 246 to 178.'
};

const subtractionCompensationProblem: IntegerAddSubtractStrategyProblem = {
    task: 'integer-add-subtract-strategy',
    strategy: 'subtraction-compensation',
    operation: 'subtraction',
    leftOperand: 643,
    rightOperand: 278,
    answer: 365,
    adjustment: 2,
    prompt: 'Use compensation to solve 643 − 278 = ?',
    questionEquation: '643 − 278 = ?',
    solutionEquation: '643 − 278 = 365',
    transformedEquation: '643 − 278 = 645 − 280',
    steps: ['278 + 2 = 280', '643 + 2 = 645', '645 − 280 = 365'],
    explanation: 'Add 2 to both numbers.'
};

const thinkAdditionProblem: IntegerAddSubtractStrategyProblem = {
    task: 'integer-add-subtract-strategy',
    strategy: 'subtraction-think-addition',
    operation: 'subtraction',
    leftOperand: 620,
    rightOperand: 303,
    answer: 317,
    adjustment: 7,
    prompt: 'Think addition to solve 620 − 303 = ?',
    questionEquation: '620 − 303 = ?',
    solutionEquation: '620 − 303 = 317',
    transformedEquation: '303 + ? = 620',
    steps: ['303 + 7 = 310', '310 + 310 = 620', '7 + 310 = 317'],
    explanation: 'Count up from 303 to 620.'
};

const makeTenProblem: IntegerAddSubtractStrategyProblem = {
    task: 'integer-add-subtract-strategy',
    strategy: 'subtraction-make-ten',
    operation: 'subtraction',
    leftOperand: 13,
    rightOperand: 5,
    answer: 8,
    adjustment: 3,
    prompt: 'Make ten to solve 13 − 5 = ?',
    questionEquation: '13 − 5 = ?',
    solutionEquation: '13 − 5 = 8',
    transformedEquation: '13 − 5 = 13 − (3 + 2)',
    steps: ['5 = 3 + 2', '13 − 3 = 10', '10 − 2 = 8'],
    explanation: 'Decompose 5 as 3 + 2, reach 10, then subtract 2.'
};

const countingOnProblem: IntegerAddSubtractStrategyProblem = {
    task: 'integer-add-subtract-strategy',
    strategy: 'addition-counting-on',
    operation: 'addition',
    leftOperand: 7,
    rightOperand: 3,
    answer: 10,
    adjustment: 3,
    prompt: 'Count on to solve 7 + 3 = ?',
    questionEquation: '7 + 3 = ?',
    solutionEquation: '7 + 3 = 10',
    transformedEquation: '7 + 3 = 7 + (1 + 1 + 1)',
    steps: ['7 + 1 = 8', '8 + 1 = 9', '9 + 1 = 10'],
    explanation: 'Start at 7 and count forward 3 steps to reach 10.'
};

const countingBackProblem: IntegerAddSubtractStrategyProblem = {
    task: 'integer-add-subtract-strategy',
    strategy: 'subtraction-counting-back',
    operation: 'subtraction',
    leftOperand: 9,
    rightOperand: 2,
    answer: 7,
    adjustment: 2,
    prompt: 'Count back to solve 9 − 2 = ?',
    questionEquation: '9 − 2 = ?',
    solutionEquation: '9 − 2 = 7',
    transformedEquation: '9 − 2 = 9 − 1 − 1',
    steps: ['9 − 1 = 8', '8 − 1 = 7'],
    explanation: 'Start at 9 and count backward 2 steps to reach 7.'
};

const additionMakeTenProblem: IntegerAddSubtractStrategyProblem = {
    task: 'integer-add-subtract-strategy',
    strategy: 'addition-make-ten',
    operation: 'addition',
    leftOperand: 8,
    rightOperand: 5,
    answer: 13,
    adjustment: 2,
    prompt: 'Make ten to solve 8 + 5 = ?',
    questionEquation: '8 + 5 = ?',
    solutionEquation: '8 + 5 = 13',
    transformedEquation: '8 + 5 = 8 + (2 + 3)',
    steps: ['5 = 2 + 3', '8 + 2 = 10', '10 + 3 = 13'],
    explanation: 'Decompose 5 as 2 + 3, reach 10, then add 3.'
};

const nearDoublesProblem: IntegerAddSubtractStrategyProblem = {
    task: 'integer-add-subtract-strategy',
    strategy: 'addition-near-doubles',
    operation: 'addition',
    leftOperand: 6,
    rightOperand: 7,
    answer: 13,
    adjustment: 1,
    prompt: 'Use a near double to solve 6 + 7 = ?',
    questionEquation: '6 + 7 = ?',
    solutionEquation: '6 + 7 = 13',
    transformedEquation: '6 + 7 = 6 + 6 + 1',
    steps: ['6 + 6 = 12', '12 + 1 = 13'],
    explanation: 'Use the known double 6 + 6, then add 1.'
};

describe('operations-add-subtract-strategy helpers', () => {
    it('accepts an exact strategy payload and masks only equation results', () => {
        expect(isValidIntegerAddSubtractStrategyProblem(additionProblem)).toBe(true);
        expect(isValidIntegerAddSubtractStrategyProblem(subtractionCompensationProblem)).toBe(true);
        expect(isValidIntegerAddSubtractStrategyProblem(makeTenProblem)).toBe(true);
        expect(isValidIntegerAddSubtractStrategyProblem(thinkAdditionProblem)).toBe(true);
        expect(isValidIntegerAddSubtractStrategyProblem(countingOnProblem)).toBe(true);
        expect(isValidIntegerAddSubtractStrategyProblem(countingBackProblem)).toBe(true);
        expect(isValidIntegerAddSubtractStrategyProblem(additionMakeTenProblem)).toBe(true);
        expect(isValidIntegerAddSubtractStrategyProblem(nearDoublesProblem)).toBe(true);
        expect(maskEquationResult(additionProblem.steps[2])).toBe('244 + 180 = ?');
        expect(maskEquationResult(additionMakeTenProblem.steps[0])).toBe('5 = 2 + ?');
        expect(maskEquationResult(makeTenProblem.steps[0])).toBe('5 = 3 + ?');
        expect(maskEquationResult('16 = 6 + 10')).toBe('16 = 6 + ?');
        expect(formatOperationRelationship(countingOnProblem, false)).toBe('7 □ 3 = 10');
        expect(formatOperationRelationship(countingOnProblem, true)).toBe('7 + 3 = 10');
        expect(formatOperationRelationship(countingBackProblem, true)).toBe('9 − 2 = 7');
        expect(isCountingRelationStrategy(countingOnProblem.strategy)).toBe(true);
        expect(isCountingRelationStrategy(countingBackProblem.strategy)).toBe(true);
        expect(isCountingRelationStrategy(additionMakeTenProblem.strategy)).toBe(false);
        expect(validateCountingRelationStrategy(countingOnProblem.strategy)).toBe('addition-counting-on');
        expect(() => validateCountingRelationStrategy(additionMakeTenProblem.strategy)).toThrow(
            'Concept derivation mode supports only counting-on and counting-back relationships.'
        );
    });

    it('rejects an incorrect invariant, result, or visible step equation', () => {
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...additionProblem,
            adjustment: 3
        })).toBe(false);
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...additionProblem,
            answer: 425,
            solutionEquation: '246 + 178 = 425'
        })).toBe(false);
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...additionProblem,
            steps: ['246 − 2 = 244', '178 + 2 = 180', '244 + 180 = 425']
        })).toBe(false);
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...makeTenProblem,
            steps: ['5 = 4 + 1', '13 − 3 = 10', '10 − 2 = 8']
        })).toBe(false);
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...countingOnProblem,
            steps: ['7 + 1 = 8', '8 + 2 = 10']
        })).toBe(false);
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...additionMakeTenProblem,
            adjustment: 3
        })).toBe(false);
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...nearDoublesProblem,
            rightOperand: 8,
            answer: 14,
            solutionEquation: '6 + 8 = 14'
        })).toBe(false);
        expect(isValidIntegerAddSubtractStrategyProblem({
            ...countingOnProblem,
            steps: 3 as unknown as readonly string[]
        })).toBe(false);
    });
});
