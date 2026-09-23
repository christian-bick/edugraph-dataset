import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionWholeEquivalenceGenerator} from './generator.ts';

describe('whole-number fraction equivalence', () => {
    it('spans the supported wholes and denominators with exact equality', () => {
        const generator = new FractionWholeEquivalenceGenerator();
        const wholes = new Set<number>(), denominators = new Set<number>();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;
            expect(data.fraction.numerator).toBe(data.wholeNumber * data.fraction.denominator);
            wholes.add(data.wholeNumber);
            denominators.add(data.fraction.denominator);
        }
        expect([...wholes].sort()).toEqual([1, 2, 3]);
        expect([...denominators].sort()).toEqual([2, 3, 4, 6, 8]);
    });
});
