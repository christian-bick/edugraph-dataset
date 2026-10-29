import {afterEach, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {FractionTenthsEquivalenceGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

describe('tenths-to-hundredths equivalence', () => {
    it('scales every supported tenth by ten, including the whole boundary', () => {
        const numerators = new Set<number>();
        const generator = new FractionTenthsEquivalenceGenerator();
        for (const fractionMagnitude of ['proper', 'equal-whole'] as const) for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const data = generator.generate({fractionMagnitude}).data;
            expect(data.tenths.denominator).toBe(10);
            expect(data.hundredths.denominator).toBe(100);
            expect(data.hundredths.numerator).toBe(data.tenths.numerator * 10);
            expect(data.scaleFactor).toBe(10);
            expect(data.tenths.numerator < data.tenths.denominator).toBe(fractionMagnitude === 'proper');
            numerators.add(data.tenths.numerator);
        }
        expect([...numerators].sort((a, b) => a-b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it('partitions all ten original numerators without dropping the equal-whole boundary', () => {
        const draw = vi.spyOn(rng, 'random');
        const numerators: number[] = [];
        const generator = new FractionTenthsEquivalenceGenerator();
        for (let index = 0; index < 9; index++) {
            draw.mockReturnValue((index + 0.5) / 9);
            numerators.push(generator.generate({fractionMagnitude: 'proper'}).data.tenths.numerator);
        }
        draw.mockReturnValue(1 - Number.EPSILON);
        numerators.push(generator.generate({fractionMagnitude: 'equal-whole'}).data.tenths.numerator);
        expect(numerators).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        expect(draw).toHaveBeenCalledTimes(10);
    });

    it('requires a supported magnitude before generating', () => {
        const generator = new FractionTenthsEquivalenceGenerator();
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({fractionMagnitude: 'mixed'} as never)).toThrow(/magnitude/);
    });
});
