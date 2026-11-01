import {describe, expect, it} from 'vitest';
import {adjacentFalseAnswer, isCanonicalJudgment} from './claims.ts';

describe('canonical equality claims', () => {
    it('rejects unsupported exact relations and claims while accepting a neighboring mathematical assertion', () => {
        const exact = {num1: 8, num2: 7, operation: 'addition' as const, answer: 15};
        expect(adjacentFalseAnswer(exact)).toBe(14);
        expect(adjacentFalseAnswer({num1: 0, num2: 0, operation: 'addition', answer: 0})).toBeUndefined();
        expect(isCanonicalJudgment({...exact, claimedAnswer: 15})).toBe(true);
        expect(isCanonicalJudgment({...exact, claimedAnswer: 14})).toBe(true);
        for (const claimedAnswer of [NaN, -1, 1.5, 16]) expect(isCanonicalJudgment({...exact, claimedAnswer})).toBe(false);
        expect(isCanonicalJudgment({...exact, answer: 16, claimedAnswer: 16})).toBe(false);
    });
});
