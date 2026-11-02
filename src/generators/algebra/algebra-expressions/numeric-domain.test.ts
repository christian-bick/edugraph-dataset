import assert from 'node:assert/strict';
import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {AlgebraExpressionsGenerator} from './generator.ts';
import {numericExpressionCaseCount, numericExpressionInputsAt, numericExpressionRangeProfiles} from './numeric-domain.ts';
import {inputsMeetNumericProfile, profilesForRelation, type AlgebraNumericProfile, type ExpressionInputs} from './numeric-profiles.ts';

const relations = ['numeric-terms', 'numeric-factors', 'numeric-sum', 'numeric-product', 'numeric-quotient', 'numeric-grouped'];
const normalize = (n: number, d: number) => {
    let a = Math.abs(n), b = d;
    while (b) [a, b] = [b, a % b];
    return {numerator: n === 0 ? 0 : n / a, denominator: d / a};
};
const key = (relation: string, profile: AlgebraNumericProfile, lower: number, upper: number, inputs: ExpressionInputs) =>
    [relation, profile, lower, upper, inputs.a, inputs.b, inputs.c, inputs.input.numerator, inputs.input.denominator].join(':');

describe('finite structural numeric ranges', () => {
    it('retains every old non-singleton input with exact raw rational-duplicate multiplicities', () => {
        const expected = new Map<string, number>(), seen = new Map<string, number>();
        const retired: Record<string, number> = {};
        for (const relation of relations) {
            retired[relation] = 0;
            for (let a = 2; a <= 9; a++) for (let b = 1; b <= 6; b++) for (let c = 1; c <= 5; c++)
                for (let n = -8; n <= 8; n++) for (let d = 1; d <= 4; d++) {
                    const inputs = {a, b, c, input: normalize(n, d)};
                    const profile = profilesForRelation(relation).filter(profile => inputsMeetNumericProfile(relation, inputs, profile));
                    assert.equal(profile.length, 1);
                    const qn = relation === 'numeric-quotient' && n === 0 ? -1 : n;
                    const qd = relation === 'numeric-quotient' && n === 0 ? 2 : d;
                    const values = relation === 'numeric-terms' ? [a * qd, b * qd, c * qd, qn, a * qn, -b * qn]
                        : relation === 'numeric-sum' || relation === 'numeric-quotient' ? [a * qd, qn] : [a * qd, b * qd, qn];
                    const min = Math.min(...values.map(Math.abs)), max = Math.max(...values.map(Math.abs));
                    if (min === max && min === 5 * qd) { retired[relation]++; continue; }
                    const upper = [5, 10, 20, 100].find(bound => max <= bound * qd)!;
                    const lower = [5, 10, 20].filter(bound => min >= bound * qd && bound < upper).at(-1) ?? 0;
                    const id = key(relation, profile[0]!, lower, upper, inputs);
                    expected.set(id, (expected.get(id) ?? 0) + 1);
                }
        }
        let tickets = 0, cells = 0;
        for (const relation of relations) for (const profile of profilesForRelation(relation)) for (const {range} of numericExpressionRangeProfiles) {
            const count = numericExpressionCaseCount(relation, profile, range);
            if (count) cells++;
            for (let index = 0; index < count; index++) {
                const inputs = numericExpressionInputsAt(relation, profile, range, index);
                const id = key(relation, profile, range.min, range.max, inputs);
                seen.set(id, (seen.get(id) ?? 0) + 1);
                tickets++;
            }
        }
        expect(seen).toEqual(expected);
        expect(tickets).toBe(97770);
        expect(cells).toBe(45);
        expect(retired).toEqual({'numeric-terms': 0, 'numeric-factors': 10, 'numeric-sum': 60,
            'numeric-product': 10, 'numeric-quotient': 60, 'numeric-grouped': 10});
    });

    it('includes only assessed signed term values and real rational magnitudes', () => {
        const find = (relation: string, profile: AlgebraNumericProfile, lower: number, upper: number, wanted: ExpressionInputs) => {
            const range = createCanonicalNumericRange(upper, lower), count = numericExpressionCaseCount(relation, profile, range);
            return Array.from({length: count}, (_, index) => numericExpressionInputsAt(relation, profile, range, index))
                .some(inputs => JSON.stringify(inputs) === JSON.stringify(wanted));
        };
        expect(find('numeric-terms', 3, 5, 100, {a: 9, b: 6, c: 5, input: normalize(8, 1)})).toBe(true);
        expect(find('numeric-terms', 3, 0, 5, {a: 2, b: 2, c: 4, input: normalize(-3, 2)})).toBe(true);
        for (const relation of ['numeric-factors', 'numeric-product', 'numeric-grouped'])
            expect(find(relation, 1, 5, 10, {a: 9, b: 6, c: 1, input: normalize(8, 1)})).toBe(true);
        expect(find('numeric-quotient', 3, 0, 10, {a: 9, b: 1, c: 1, input: normalize(-1, 4)})).toBe(true);
        expect(find('numeric-sum', 1, 0, 5, {a: 2, b: 1, c: 1, input: normalize(7, 4)})).toBe(true);
    });

    it('rejects missing, deferred and infeasible ranges before any mathematical randomness', () => {
        const generator = new AlgebraExpressionsGenerator(), draw = vi.spyOn(rng, 'random');
        const config = {relation: 'numeric-sum', power: 'none', numericProfile: 1} as const;
        try {
            expect(() => generator.generate(config)).toThrow(/range/);
            expect(() => generator.generate({...config, range: false})).toThrow(/range/);
            expect(() => generator.generate({...config, range: createCanonicalNumericRange(100)})).toThrow(/range/);
            expect(() => generator.generate({...config, range: {...createCanonicalNumericRange(5), maximumAbove: 0}})).toThrow(/range/);
            expect(() => generator.generate({relation: 'symbolic-sum', power: 'none', numericProfile: 0, range: createCanonicalNumericRange(5)})).toThrow(/Symbolic/);
            for (const index of [-1, 0.5, NaN, Infinity, numericExpressionCaseCount('numeric-sum', 1, createCanonicalNumericRange(5))])
                expect(() => numericExpressionInputsAt('numeric-sum', 1, createCanonicalNumericRange(5), index)).toThrow(RangeError);
            expect(numericExpressionCaseCount('symbolic-sum', 0, createCanonicalNumericRange(5))).toBe(0);
            expect(() => numericExpressionInputsAt('symbolic-sum', 0, createCanonicalNumericRange(5), 0)).toThrow(RangeError);
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });
});
