import {afterEach, describe, expect, it, vi} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import * as rng from '../../../lib/random.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {FractionProductsGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

describe('fraction-product multiplier magnitude profiles', () => {
    it.each(['proper', 'improper'] as const)('retains every original %s multiplier and conditional numerator weight', magnitude => {
        const generator = new FractionProductsGenerator();
        const random = vi.spyOn(rng, 'random');
        const seen = new Set<string>();
        for (let denominator = 2; denominator <= 6; denominator++) {
            const count = magnitude === 'proper' ? denominator - 1 : 2 * denominator - 1;
            const first = magnitude === 'proper' ? 1 : denominator + 1;
            const frequencies = new Map<number, number>();
            for (let index = 0; index < count; index++) {
                random.mockReturnValueOnce((denominator - 2 + 0.5) / 5)
                    .mockReturnValueOnce((index + 0.5) / count)
                    .mockReturnValueOnce(0).mockReturnValueOnce(0).mockReturnValueOnce(0);
                const data = generator.generate({productProfile: `fraction-equation-${magnitude}`}).data;
                const candidate = first + index;
                const expected = magnitude === 'improper' && candidate === 2 * denominator ? candidate + 1 : candidate;
                expect(data.multiplierValue).toEqual({numerator: expected, denominator});
                expect(data.multiplierValue.numerator < denominator).toBe(magnitude === 'proper');
                frequencies.set(expected, (frequencies.get(expected) ?? 0) + 1);
                seen.add(`${expected}/${denominator}`);
            }
            if (magnitude === 'improper') {
                expect(frequencies.has(2 * denominator)).toBe(false);
                // The old sampler maps its whole-number draw to the adjacent numerator.
                expect(frequencies.get(2 * denominator + 1)).toBe(2);
                expect([...frequencies.values()].reduce((sum, frequency) => sum + frequency, 0)).toBe(count);
            } else expect([...frequencies.values()].every(frequency => frequency === 1)).toBe(true);
        }
        expect(seen.size).toBe(magnitude === 'proper' ? 15 : 30);
    });

    it('grounds proper involvement in the explicit multiplier even when other fractions are improper', () => {
        vi.spyOn(rng, 'random').mockReturnValueOnce(0.9).mockReturnValueOnce(0.9)
            .mockReturnValueOnce(0).mockReturnValueOnce(0.9).mockReturnValueOnce(0);
        const generated = generateWithLabels(new FractionProductsGenerator(), [
            Area.Multiplication, Area.Equation, Scope.FractionNumbers,
            Scope.SingleFrameOfReference, Scope.ProperFractions
        ])!;
        expect(generated.labels).toContain(Scope.ProperFractions);
        expect(generated.data.multiplierValue).toEqual({numerator: 5, denominator: 6});
        expect(generated.data.quantityValue).toEqual({numerator: 5, denominator: 2});
        expect(generated.data.product).toEqual({numerator: 25, denominator: 12});
    });
});
