import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {numericProfileBundles, resolveNumericProfile, sampleSinglePower, singlePowerCandidates} from './numeric-profiles.ts';

afterEach(() => vi.restoreAllMocks());

describe('single-power numeric profiles', () => {
    it.each([false, true])('partitions every original finite draw path, positive exponents=%s', positive => {
        const pools = [1, 2, 3, 4].map(profile => singlePowerCandidates(positive, profile as 1 | 2 | 3 | 4));
        const all = pools.flat();
        expect(all).toHaveLength(positive ? 204 : 264);
        expect(all.reduce((sum, candidate) => sum + candidate.weight, 0)).toBeCloseTo(1, 13);
        const keys = pools.map(pool => new Set(pool.map(candidate => `${candidate.base.numerator}/${candidate.base.denominator}^${candidate.exponent}`)));
        for (let i = 0; i < keys.length; i++) for (let j = i + 1; j < keys.length; j++) {
            expect([...keys[i]!].some(key => keys[j]!.has(key))).toBe(false);
        }
        const original = new Set<string>();
        for (let exponent = positive ? 1 : 0; exponent <= 3; exponent++) for (let denominator = 1; denominator <= 4; denominator++) {
            for (let numerator = exponent === 0 ? 1 : 0; numerator <= 3 * denominator; numerator++) {
                for (const sign of [-1, 1]) {
                    const divisor = gcd(numerator, denominator);
                    original.add(`${numerator === 0 ? 0 : sign * numerator / divisor}/${denominator / divisor}^${exponent}`);
                }
            }
        }
        expect(new Set(keys.flatMap(set => [...set]))).toEqual(original);
        expect(pools[3]!.length === 0).toBe(positive);
    });

    it.each([1, 2, 3, 4] as const)('samples every interval in numeric profile %i truthfully', profile => {
        const pool = singlePowerCandidates(false, profile);
        const total = pool.reduce((sum, candidate) => sum + candidate.weight, 0);
        let offset = 0;
        const random = vi.spyOn(rng, 'random');
        for (const candidate of pool) {
            random.mockReturnValue((offset + candidate.weight / 2) / total);
            expect(sampleSinglePower(false, profile)).toEqual(candidate);
            expect(candidate.base.numerator < 0).toBe(profile > 2);
            expect(candidate.base.numerator === 0 || candidate.exponent === 0).toBe(profile % 2 === 0);
            offset += candidate.weight;
        }
        expect(sampleSinglePower(true, 4)).toBeNull();
    });

    it('keeps the mixed empty binding separate from single fallback bundles', () => {
        expect(resolveNumericProfile([Area.OrderOfOperations])).toBe(0);
        expect(resolveNumericProfile([])).toBeUndefined();
        expect(resolveNumericProfile([...numericProfileBundles[0]])).toBe(1);
        expect(resolveNumericProfile([...numericProfileBundles[3], Scope.PositiveExponent])).toBeUndefined();
        expect(resolveNumericProfile([...numericProfileBundles[0], Area.OrderOfOperations])).toBeUndefined();
    });
});

function gcd(a: number, b: number): number {
    while (b) [a, b] = [b, a % b];
    return a;
}
