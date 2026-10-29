import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {PowersOfTenGenerator} from './generator.ts';

describe('PowersOfTenGenerator', () => {
    const generator = new PowersOfTenGenerator();

    it('rejects a missing configuration', () => {
        expect(() => generator.generate(null as never)).toThrow();
    });

    it('models zero, one, and two nonnegative integer exponents exactly', () => {
        const exponents = new Set<number>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const zeroExponent = seed % 2 === 0;
            const {data} = generator.generate({zeroExponent});
            expect(data.kind).toBe('power-ten-notation');
            const {power} = data;
            exponents.add(power.exponent);
            expect(power.base).toBe(10);
            expect(power.value).toBe(10 ** power.exponent);
            expect(power.repeatedFactors).toHaveLength(power.exponent);
            expect(power.repeatedFactors.every(factor => factor === 10)).toBe(true);
            expect(power.exponent).toBeGreaterThanOrEqual(0);
            expect(power.exponent === 0).toBe(zeroExponent);
        }
        expect(exponents).toEqual(new Set([0, 1, 2]));
    });

    it('represents 10^0 as one and an empty product', () => {
        const {power} = generator.generate({zeroExponent: true}).data;
        expect(power.value).toBe(1);
        expect(power.repeatedFactors).toEqual([]);
    });

    it('replays deterministically from a seed', () => {
        setSeed('formal-power-ten');
        const first = generator.generate({zeroExponent: false});
        setSeed('formal-power-ten');
        expect(generator.generate({zeroExponent: false})).toEqual(first);
    });

    it('rejects an absent or invalid profile', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({zeroExponent: 'yes'} as never)).toThrow();
    });
});
