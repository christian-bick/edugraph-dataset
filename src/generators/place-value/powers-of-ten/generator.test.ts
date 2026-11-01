import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {PowersOfTenGenerator} from './generator.ts';
const generator = new PowersOfTenGenerator();
describe('canonical power-ten notation profiles', () => {
    it.each([[0, 10], [1, 10], [2, 100]] as const)('retains exponent%s with tight upper%s', (exponent, upper) => {
        const draw = vi.spyOn(rng, 'random').mockReturnValue(0.5);
        try {
            const {power} = generator.generate({exponent}).data;
            expect(power.base).toBe(10);
            expect(power.exponent).toBe(exponent);
            expect(power.value).toBe(10 ** exponent);
            expect(power.repeatedFactors).toEqual(Array(exponent).fill(10));
            expect(hasCanonicalRangeWitness([power.base, power.exponent, power.value], createCanonicalNumericRange(upper))).toBe(true);
            expect(draw).toHaveBeenCalledTimes(1);
        } finally {draw.mockRestore();}
    });
    it('rejects missing and unsupported profiles before a draw', () => {
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const config of [undefined, {}, {exponent: -1}, {exponent: 3}, {exponent: 0.5}]) {
                expect(() => generator.generate(config as never)).toThrow();
            }
            expect(draw).not.toHaveBeenCalled();
        } finally {draw.mockRestore();}
    });
});
