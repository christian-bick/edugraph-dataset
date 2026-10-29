import {describe, expect, it} from 'vitest';
import {resolveEquationClaim} from './helpers.ts';

describe('equation judgment projection', () => {
    it.each([
        [{num1: 8, num2: 7, operation: 'addition', answer: 15}, 14],
        [{num1: 2, num2: 1, operation: 'subtraction', answer: 1}, 0],
        [{num1: 0, num2: 1, operation: 'addition', answer: 1}, 0]
    ] as const)('validates supplied bounded true and false mathematical equalities', (data, falseAnswer) => {
        expect(resolveEquationClaim({...data, claimedAnswer: data.answer})).toEqual({
            claimedAnswer: data.answer,
            isTrue: true
        });
        expect(resolveEquationClaim({...data, claimedAnswer: falseAnswer})).toEqual({
            claimedAnswer: falseAnswer,
            isTrue: false
        });
    });

    it('fails closed for missing, noninteger or unsupported claims', () => {
        const data = {num1: 8, num2: 7, operation: 'addition' as const, answer: 15};
        for (const claimedAnswer of [undefined, -1, 1.5, 100]) {
            expect(() => resolveEquationClaim({...data, claimedAnswer: claimedAnswer as number})).toThrow();
        }
    });
});
