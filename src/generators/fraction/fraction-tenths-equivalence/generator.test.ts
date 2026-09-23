import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionTenthsEquivalenceGenerator} from './generator.ts';

describe('tenths-to-hundredths equivalence', () => {
    it('scales every supported tenth by ten, including the whole boundary', () => {
        const numerators = new Set<number>();
        const generator = new FractionTenthsEquivalenceGenerator();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;
            expect(data.tenths.denominator).toBe(10);
            expect(data.hundredths.denominator).toBe(100);
            expect(data.hundredths.numerator).toBe(data.tenths.numerator * 10);
            expect(data.scaleFactor).toBe(10);
            numerators.add(data.tenths.numerator);
        }
        expect([...numerators].sort((a, b) => a-b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });
});
