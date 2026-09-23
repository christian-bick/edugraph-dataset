import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionEquivalenceGenerator} from './generator.ts';

describe('proper-fraction equivalence', () => {
    const generator = new FractionEquivalenceGenerator();
    it('rejects missing or malformed constraints', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({usesMultiplication: 'yes'} as never)).toThrow();
    });
    it.each([false, true])('scales both fraction terms coherently with multiplication required: %s', usesMultiplication => {
        const factors = new Set<number>();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const data = generator.generate({usesMultiplication}).data;
            expect(data.first.numerator).toBeGreaterThan(0);
            expect(data.first.numerator).toBeLessThan(data.first.denominator);
            expect(data.second.numerator).toBe(data.first.numerator * data.scaleFactor);
            expect(data.second.denominator).toBe(data.first.denominator * data.scaleFactor);
            expect([2, 3, 4, 6, 8]).toContain(data.second.denominator);
            factors.add(data.scaleFactor);
        }
        expect([...factors].sort()).toEqual([2, 3, 4]);
    });
    it('replays the same mathematical relation for the same seed', () => {
        setSeed('proper-equivalence');
        const first = generator.generate({usesMultiplication: true});
        setSeed('proper-equivalence');
        expect(generator.generate({usesMultiplication: true})).toEqual(first);
    });
});
