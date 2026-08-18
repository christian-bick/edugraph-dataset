import {describe, expect, it} from 'vitest';
import {IntegerAddSubtractStrategyProblem} from '../../../../types/problems.ts';
import {isValidIntegerAddSubtractStrategyProblem, maskEquationResult} from './helpers.ts';

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

describe('operations-add-subtract-strategy helpers', () => {
    it('accepts an exact strategy payload and masks only equation results', () => {
        expect(isValidIntegerAddSubtractStrategyProblem(additionProblem)).toBe(true);
        expect(isValidIntegerAddSubtractStrategyProblem(subtractionCompensationProblem)).toBe(true);
        expect(isValidIntegerAddSubtractStrategyProblem(makeTenProblem)).toBe(true);
        expect(isValidIntegerAddSubtractStrategyProblem(thinkAdditionProblem)).toBe(true);
        expect(maskEquationResult(additionProblem.steps[2])).toBe('244 + 180 = ?');
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
    });
});
