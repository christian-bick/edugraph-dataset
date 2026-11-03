import {afterEach, describe, expect, it, vi} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {generateWithLabels} from '../../../lib/utils.ts';
import {fractionProductDomain, fractionProductNativeDomain} from '../fraction-product-domain.ts';
import {FractionProductsGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

describe('fraction-product multiplier magnitude profiles', () => {
    it.each(['proper', 'improper'] as const)('retains every original %s multiplier and conditional numerator weight', magnitude => {
        const rows = fractionProductNativeDomain(`fraction-equation-${magnitude}`);
        const total = rows.reduce((sum, row) => sum + row.weight, 0);
        const seen = new Set<string>();
        for (let b = 2; b <= 6; b++) {
            const factors = new Map<number, number>();
            for (const row of rows.filter(row => row.multiplier.denominator === b)) {
                if (row.multiplier.form !== 'fraction') throw new Error('Expected original fractional factors.');
                const a = row.multiplier.numerator;
                factors.set(a, (factors.get(a) ?? 0) + row.weight);
                seen.add(`${a}/${b}`);
                expect(a < b).toBe(magnitude === 'proper');
            }
            const denominatorTotal = [...factors.values()].reduce((sum, weight) => sum + weight, 0);
            expect(denominatorTotal * 5).toBe(total);
            const count = magnitude === 'proper' ? b - 1 : 2 * b - 1;
            for (const [a, weight] of factors) {
                const multiplicity = magnitude === 'improper' && a === 2 * b + 1 ? 2 : 1;
                expect(BigInt(weight) * 5n * BigInt(count)).toBe(BigInt(total) * BigInt(multiplicity));
            }
            if (magnitude === 'improper') expect(factors.has(2 * b)).toBe(false);
        }
        expect(seen.size).toBe(magnitude === 'proper' ? 15 : 30);
    });

    it('grounds proper involvement in the explicit multiplier even when other fractions are improper', () => {
        const domain = fractionProductDomain('derivation', 'fraction-equation-proper', createCanonicalNumericRange(20));
        const index = domain.findIndex(row => row.multiplier.form === 'fraction' && row.quantity.form === 'fraction'
            && row.multiplier.numerator === 5 && row.multiplier.denominator === 6
            && row.quantity.numerator === 5 && row.quantity.denominator === 2);
        expect(index).toBeGreaterThanOrEqual(0);
        const total = domain.reduce((sum, row) => sum + row.weight, 0);
        const preceding = domain.slice(0, index).reduce((sum, row) => sum + row.weight, 0);
        vi.spyOn(rng, 'random').mockReturnValueOnce((preceding + domain[index]!.weight / 2) / total).mockReturnValueOnce(0);
        const generated = generateWithLabels(new FractionProductsGenerator(), [
            Area.Multiplication, Area.Equation, Scope.FractionNumbers,
            Scope.SingleFrameOfReference, Scope.ProperFractions, Scope.NumbersSmaller20
        ])!;
        expect(generated.labels).toContain(Scope.ProperFractions);
        expect(generated.data.multiplierValue).toEqual({numerator: 5, denominator: 6});
        expect(generated.data.quantityValue).toEqual({numerator: 5, denominator: 2});
        expect(generated.data.product).toEqual({numerator: 25, denominator: 12});
    });
});
