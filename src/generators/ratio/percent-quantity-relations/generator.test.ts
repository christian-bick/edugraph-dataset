import {describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as randomModule from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {greatestCommonDivisor} from '../helpers.ts';
import {PercentQuantityRelationsGenerator} from './generator.ts';
import {PERCENT_SOURCE_CAP} from './numeric-domain.ts';

const generator = new PercentQuantityRelationsGenerator();

describe('PercentQuantityRelationsGenerator', () => {
    it('requires a resolved and supported mathematical range', () => {
        for (const config of [
            null, {}, {range: null}, {range: 1000}, {range: {}},
            {range: {min: 1, max: 1000}}, {range: {min: -1, max: 1000}},
            {range: {min: 0, max: 100}}, {range: {min: 0, max: Infinity}},
            {range: createCanonicalNumericRange(20)}, {range: createCanonicalNumericRange(100, 5)}
        ]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });

    it.each([100, 120, 1000, 10000])(
        'preserves exact percent, forward and inverse relations within range %s', max => {
            const range = createCanonicalNumericRange(max);
            const percentProfiles = new Set<string>();
            const wholeProfiles = new Set<string>();
            const partProfiles = new Set<string>();
            const problems = new Set<string>();
            for (let seed = 0; seed < 300; seed++) {
                setSeed(seed);
                const {data} = generator.generate({range});
                expect(data.kind).toBe('percent-quantity');
                expect(Number.isSafeInteger(data.percent)).toBe(true);
                expect(data.percent).toBeGreaterThanOrEqual(1);
                expect(data.percent).toBeLessThanOrEqual(150);
                expect(data.perHundred).toEqual({numerator: data.percent, denominator: 100});
                expect(data.scaleFactor.numerator * 100).toBe(data.percent * data.scaleFactor.denominator);
                const {whole, part, scaleFactor} = data;
                expect(part.numerator * whole.denominator * scaleFactor.denominator)
                    .toBe(whole.numerator * scaleFactor.numerator * part.denominator);
                expect(whole.numerator * part.denominator * scaleFactor.numerator)
                    .toBe(part.numerator * scaleFactor.denominator * whole.denominator);
                for (const value of [whole, part, scaleFactor]) {
                    expect(Number.isSafeInteger(value.numerator)).toBe(true);
                    expect(Number.isSafeInteger(value.denominator)).toBe(true);
                    expect(value.numerator).toBeGreaterThan(0);
                    expect(value.denominator).toBeGreaterThan(0);
                    expect(greatestCommonDivisor(value.numerator, value.denominator)).toBe(1);
                    expect(value.numerator).toBeLessThanOrEqual(PERCENT_SOURCE_CAP);
                    expect(value.denominator).toBeLessThanOrEqual(400);
                    expect(value.numerator / value.denominator).toBeLessThanOrEqual(max);
                }
                expect(whole.numerator * scaleFactor.numerator).toBeLessThanOrEqual(PERCENT_SOURCE_CAP);
                expect(hasCanonicalRangeWitness([data.percent, 100, scaleFactor.numerator / scaleFactor.denominator,
                    whole.numerator / whole.denominator, part.numerator / part.denominator], range)).toBe(true);
                if (data.percent === 100) expect(part).toEqual(whole);
                const relation = Math.sign(part.numerator * whole.denominator - whole.numerator * part.denominator);
                expect(relation).toBe(Math.sign(data.percent - 100));
                percentProfiles.add(data.percent < 100 ? 'less' : data.percent === 100 ? 'equal' : 'greater');
                wholeProfiles.add(whole.denominator === 1 ? 'integer' : 'fractional');
                partProfiles.add(part.denominator === 1 ? 'integer' : 'fractional');
                problems.add(JSON.stringify(data));
                expect(Object.keys(data).sort()).toEqual(['kind', 'part', 'perHundred', 'percent', 'scaleFactor', 'whole']);
            }
            expect(percentProfiles).toEqual(new Set(max === 100 ? ['less', 'equal'] : ['less', 'equal', 'greater']));
            expect(wholeProfiles).toEqual(new Set(['integer', 'fractional']));
            expect(partProfiles).toEqual(new Set(['integer', 'fractional']));
            expect(problems.size).toBeGreaterThan(220);
        }
    );

    it('separates magnitude bands without changing the mathematical percent relation', () => {
        let largeNumerators = 0;
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const smaller = generator.generate({range: createCanonicalNumericRange(1000)}).data;
            setSeed(seed);
            const larger = generator.generate({range: createCanonicalNumericRange(10000)}).data;
            expect(Math.max(larger.whole.numerator / larger.whole.denominator,
                larger.part.numerator / larger.part.denominator)).toBeGreaterThan(1000);
            expect(Math.max(smaller.whole.numerator / smaller.whole.denominator,
                smaller.part.numerator / smaller.part.denominator, smaller.percent)).toBeLessThanOrEqual(1000);
            if (larger.whole.numerator >= 1000 || larger.part.numerator >= 1000) largeNumerators++;
        }
        expect(largeNumerators).toBeGreaterThan(40);
    });

    it('reproduces the same relation with the same seed and config', () => {
        setSeed(88);
        const first = generator.generate({range: createCanonicalNumericRange(1000)});
        setSeed(88);
        expect(generator.generate({range: createCanonicalNumericRange(1000)})).toEqual(first);
    });

    it.each([[100, 1, 100, 400, 4], [120, 101, 120, 400, 4],
        [1000, 121, 150, 2666, 4], [10000, 1001, 150, 3333, 4]] as const)(
        'supports both mathematical draw boundaries at upper%s', (upper, firstWhole, lastPercent, lastNumerator, lastDenominator) => {
            const mock = vi.spyOn(randomModule, 'random');
            try {
                mock.mockReturnValue(0);
                const first = generator.generate({range: createCanonicalNumericRange(upper)}).data;
                expect(first.percent).toBe(1);
                expect(first.whole).toEqual({numerator: firstWhole, denominator: 1});
                // This is the maximum possible Mulberry32 draw, still strictly below1.
                mock.mockReturnValue(0xffffffff / 0x100000000);
                const last = generator.generate({range: createCanonicalNumericRange(upper)}).data;
                expect(last.percent).toBe(lastPercent);
                const divisor = greatestCommonDivisor(lastNumerator, lastDenominator);
                expect(last.whole).toEqual({numerator: lastNumerator / divisor, denominator: lastDenominator / divisor});
                for (const data of [first, last]) expect(hasCanonicalRangeWitness([100, data.percent,
                    data.scaleFactor.numerator / data.scaleFactor.denominator, data.whole.numerator / data.whole.denominator,
                    data.part.numerator / data.part.denominator], createCanonicalNumericRange(upper))).toBe(true);
            } finally {
                mock.mockRestore();
            }
        }
    );
});
