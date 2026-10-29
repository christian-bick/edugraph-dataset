import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import type {EquationJudgmentProblem} from '../../../types/problems.ts';
import {ArithmeticEquationJudgmentGenerator} from './generator.ts';
import {adjacentFalseAnswer, isCanonicalJudgment} from './claims.ts';

afterEach(() => vi.restoreAllMocks());

describe('canonical equality claims', () => {
    it('retains every old expression and true/false claim in the actual target domain exactly once', () => {
        const generator = new ArithmeticEquationJudgmentGenerator();
        let entropy: number[] = [];
        vi.spyOn(rng, 'random').mockImplementation(() => {
            const value = entropy.shift();
            if (value === undefined) throw new Error('Unexpected extra draw');
            return value;
        });
        const visit = (exact: Omit<EquationJudgmentProblem, 'claimedAnswer'>, oldOperandZero: boolean) => {
            for (const trueClaim of [true, false]) {
                const claimedAnswer = trueClaim ? exact.answer : exact.answer > 0 ? exact.answer - 1 : 1;
                const zero = [exact.num1, exact.num2, exact.answer, claimedAnswer].includes(0);
                const relation = `${exact.operation}-${zero ? 'zero' : 'positive'}` as const;
                const selection = exact.operation === 'subtraction' && zero ? [oldOperandZero ? 0.25 : 0.75] : [];
                const originalDraws = oldOperandZero ? [(exact.num2 - 0.5) / 20]
                    : exact.operation === 'addition' ? [(exact.num1 - 0.5) / 19, (exact.num2 - 0.5) / (20 - exact.num1)]
                        : [(exact.num2 - 0.5) / 19, (exact.answer - 0.5) / (20 - exact.num2)];
                entropy = [...selection, ...originalDraws, trueClaim ? 0.25 : 0.75];
                const stub = generator.generate({relation, range: {min: 0, max: 20}});
                expect(stub?.data).toEqual({...exact, claimedAnswer});
                expect(entropy).toEqual([]);
                expect(isCanonicalJudgment(stub!.data)).toBe(true);
            }
        };
        for (let first = 1; first <= 20; first++) {
            visit({num1: 0, num2: first, operation: 'addition', answer: first}, true);
            visit({num1: first, num2: first, operation: 'subtraction', answer: 0}, true);
            for (let second = 1; first + second <= 20; second++) {
                visit({num1: first, num2: second, operation: 'addition', answer: first + second}, false);
                visit({num1: first + second, num2: first, operation: 'subtraction', answer: second}, false);
            }
        }
    });

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
