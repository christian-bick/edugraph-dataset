import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as randomModule from '../../../lib/random.ts';
import {FractionQuotientModelGenerator} from './generator.ts';
import {quotientRangePairs} from './numeric-domain.ts';

afterEach(() => vi.restoreAllMocks());
const bounds = [5, 10, 20, 100];
const domains = [
    ['notation', 'proper', [10, 5, 0, 0]], ['notation', 'improper', [10, 5, 0, 0]],
    ['whole-sharing', 'zero', [5, 1, 0, 0]], ['whole-sharing', 'nonzero', [25, 11, 0, 0]],
    ['unit-divisor', 'zero', [5, 0, 0, 0]], ['unit-divisor', 'nonzero', [5, 8, 11, 6]]
] as const;

describe('fraction quotient finite canonical pairs', () => {
    it('partitions all107 original role/numeric pairs without changing their uniform conditional law', () => {
        let count = 0;
        for (const [role, profile, expectedCounts] of domains) {
            const seen = new Set<string>();
            for (const [index, upper] of bounds.entries()) {
                const range = createCanonicalNumericRange(upper), pairs = quotientRangePairs(role, profile, range);
                expect(pairs).toHaveLength(expectedCounts[index]!);
                for (const [a, b] of pairs) {
                    const key = `${a}:${b}`;
                    expect(seen.has(key)).toBe(false); seen.add(key);
                    expect(a >= (profile === 'zero' ? 0 : 1) && a <= (profile === 'zero' ? 0 : 6)).toBe(true);
                    expect(b >= (role === 'whole-sharing' ? 1 : 2) && b <= 6).toBe(true);
                    if (role === 'notation') expect(a < b).toBe(profile === 'proper');
                    const originalCount = expectedCounts.reduce<number>((sum, n) => sum + n, 0);
                    expect((1 / originalCount) / (pairs.length / originalCount)).toBeCloseTo(1 / pairs.length, 14);
                    count++;
                }
            }
            // Independent original nested-draw domains establish completeness.
            for (let a = profile === 'zero' ? 0 : 1; a <= (profile === 'zero' ? 0 : 6); a++)
                for (let b = role === 'whole-sharing' ? 1 : 2; b <= 6; b++) {
                    if (role === 'notation' && (a < b) !== (profile === 'proper')) continue;
                    expect(seen.delete(`${a}:${b}`)).toBe(true);
                }
            expect(seen.size).toBe(0);
        }
        expect(count).toBe(107);
    });

    it('reaches all177 settled original relation pairs and both material variants through production', () => {
        const generator = new FractionQuotientModelGenerator(), draw = vi.spyOn(randomModule, 'random');
        let count = 0;
        for (const [role, profile] of domains) for (const upper of bounds) {
            const range = createCanonicalNumericRange(upper), pairs = quotientRangePairs(role, profile, range);
            const relations = role === 'notation' ? ['fraction-as-quotient'] as const : role === 'whole-sharing'
                ? ['whole-sharing-equation'] as const : ['unit-divisor-basic', 'unit-divisor-inverse', 'unit-divisor-equation'] as const;
            for (const relationProfile of relations) for (const [index, [a, b]] of pairs.entries()) for (const material of [0.25, 0.75]) {
                const inputs = [(index + 0.5) / pairs.length, material];
                draw.mockReset().mockImplementation(() => inputs.shift()!);
                const data = generator.generate({relationProfile, numericProfile: profile, range}).data;
                expect(data.dividend).toEqual({numerator: a, denominator: 1});
                expect(data.divisor).toEqual(role === 'unit-divisor' ? {numerator: 1, denominator: b} : {numerator: b, denominator: 1});
                expect(data.story.material).toBe(material < 0.5 ? 'ribbon' : 'rope');
                const values = [data.dividend.numerator / data.dividend.denominator,
                    data.divisor.numerator / data.divisor.denominator, data.quotient.numerator / data.quotient.denominator];
                // Whole-sharing has a recipient count; unit-divisor tasks have
                // an actual quotient/group count. No latent totalParts is used.
                if (role !== 'unit-divisor') values.push(a, b, 1);
                expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                expect(inputs).toEqual([]); count++;
            }
        }
        expect(count).toBe(354);
    });

    it('rejects malformed or empty canonical profiles before any draw', () => {
        const generator = new FractionQuotientModelGenerator(), draw = vi.spyOn(randomModule, 'random');
        for (const range of [undefined, createCanonicalNumericRange(1000), createCanonicalNumericRange(10, 5),
            {...createCanonicalNumericRange(5), maximumAbove: 0}, {...createCanonicalNumericRange(5), minimumBelow: 10}])
            expect(() => generator.generate({relationProfile: 'unit-divisor-basic', numericProfile: 'zero', range})).toThrow();
        expect(() => generator.generate({relationProfile: 'unit-divisor-basic', numericProfile: 'zero', range: createCanonicalNumericRange(10)})).toThrow(/No group-count/);
        expect(() => quotientRangePairs('notation', 'zero', createCanonicalNumericRange(5))).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
