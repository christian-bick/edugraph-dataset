import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionEquivalenceGenerator} from './generator.ts';

describe('proper-fraction equivalence', () => {
    const generator = new FractionEquivalenceGenerator();
    it('rejects missing or malformed constraints', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({usesMultiplication: true} as never)).toThrow();
        expect(() => generator.generate({usesMultiplication: 'yes', usesProportionalScaling: false} as never)).toThrow();
        expect(() => generator.generate({usesMultiplication: true, usesProportionalScaling: 'yes'} as never)).toThrow();
    });
    it.each([
        {usesMultiplication: false, usesProportionalScaling: false},
        {usesMultiplication: true, usesProportionalScaling: false},
        {usesMultiplication: false, usesProportionalScaling: true},
        {usesMultiplication: true, usesProportionalScaling: true}
    ])('scales both fraction terms with exact unit multiplier for %o', config => {
        const factors = new Set<number>();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const data = generator.generate(config).data;
            expect(data.first.numerator).toBeGreaterThan(0);
            expect(data.first.numerator).toBeLessThan(data.first.denominator);
            expect(data.second.numerator).toBe(data.first.numerator * data.scaleFactor);
            expect(data.second.denominator).toBe(data.first.denominator * data.scaleFactor);
            expect(data.unitMultiplier).toEqual({
                numerator: data.scaleFactor,
                denominator: data.scaleFactor,
                value: 1
            });
            expect(data.first.numerator * data.second.denominator)
                .toBe(data.second.numerator * data.first.denominator);
            expect([2, 3, 4, 6, 8]).toContain(data.second.denominator);
            factors.add(data.scaleFactor);
        }
        expect([...factors].sort()).toEqual([2, 3, 4]);
    });
    it('replays the same mathematical relation for the same seed', () => {
        setSeed('proper-equivalence');
        const first = generator.generate({usesMultiplication: true, usesProportionalScaling: true});
        setSeed('proper-equivalence');
        expect(generator.generate({usesMultiplication: true, usesProportionalScaling: true})).toEqual(first);
        setSeed('proper-equivalence');
        expect(generator.generate({usesMultiplication: false, usesProportionalScaling: false})).toEqual(first);
    });
});
