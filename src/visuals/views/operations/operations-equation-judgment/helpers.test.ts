import {describe, expect, it} from 'vitest';
import {EquationJudgmentProblem} from '../../../../types/problems.ts';
import {resolveEquationClaim} from './helpers.ts';

describe('equation judgment projection', () => {
    it.each([
        [{num1: 8, num2: 7, operation: 'addition', answer: 15}, 14],
        [{num1: 2, num2: 1, operation: 'subtraction', answer: 1}, 0],
        [{num1: 0, num2: 1, operation: 'addition', answer: 1}, 0]
    ] as const)('derives bounded true and false claims from the exact relation', (data, falseAnswer) => {
        expect(resolveEquationClaim(data as EquationJudgmentProblem, 2)).toEqual({
            claimedAnswer: data.answer,
            isTrue: true
        });
        expect(resolveEquationClaim(data as EquationJudgmentProblem, 3)).toEqual({
            claimedAnswer: falseAnswer,
            isTrue: false
        });
    });
});
