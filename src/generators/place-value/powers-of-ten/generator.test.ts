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
            const {data} = generator.generate({});
            expect(data.kind).toBe('power-ten-notation');
            const {power} = data;
            exponents.add(power.exponent);
            expect(power.base).toBe(10);
            expect(power.value).toBe(10 ** power.exponent);
            expect(power.repeatedFactors).toHaveLength(power.exponent);
            expect(power.repeatedFactors.every(factor => factor === 10)).toBe(true);
            expect(power.exponent).toBeGreaterThanOrEqual(0);
        }
        expect(exponents).toEqual(new Set([0, 1, 2]));
    });

    it('represents 10^0 as one and an empty product', () => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const {power} = generator.generate({}).data;
            if (power.exponent !== 0) continue;
            expect(power.value).toBe(1);
            expect(power.repeatedFactors).toEqual([]);
            return;
        }
        throw new Error('No zero-exponent sample was found.');
    });

    it('replays deterministically from a seed', () => {
        setSeed('formal-power-ten');
        const first = generator.generate({});
        setSeed('formal-power-ten');
        expect(generator.generate({})).toEqual(first);
    });
});
