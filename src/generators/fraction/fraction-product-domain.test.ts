import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {buildFractionProduct, buildFractionProductRelation, fractionProductDomain, fractionProductNativeDomain,
    fractionProductProfiles, fractionProductUpperBounds, selectFractionProductOperands,
    type FractionProductContract, type FractionProductOperands} from './fraction-product-domain.ts';

const originalValue = (operand: FractionProductOperands['multiplier']) =>
    [operand.form === 'mixed' ? operand.improperNumerator : operand.numerator, operand.denominator] as const;
const bounds = [5, 10, 20, 100, 120];
const key = (operands: FractionProductOperands) => JSON.stringify([operands.operandForm, operands.multiplier, operands.quantity]);

/** Independent arithmetic oracle: no production quantity/range helper is used here. */
function expectedUpper(operands: FractionProductOperands, contract: FractionProductContract): number {
    const [a, b] = originalValue(operands.multiplier), [q, c] = originalValue(operands.quantity);
    const values = [[a, b], [q, c], [a * q, b * c], [q, b * c], [a, 1], [b, 1], [Math.ceil(a / b), 1],
        ...(contract === 'derivation' ? [[a * q, c]] : [])];
    return bounds.find(upper => values.every(([n, d]) => n! <= upper * d!))!;
}

describe('fraction-product weighted mathematical domains', () => {
    it.each(fractionProductProfiles)('%s preserves exact original outcome probabilities', profile => {
        const rows = fractionProductNativeDomain(profile);
        expect(rows).toHaveLength([765, 1530, 675, 1350, 1350][fractionProductProfiles.indexOf(profile)]!);
        expect(new Set(rows.map(key)).size).toBe(rows.length);
        const total = BigInt(rows.reduce((sum, row) => sum + row.weight, 0));
        for (const row of rows) {
            const [a, b] = originalValue(row.multiplier), [, c] = originalValue(row.quantity);
            const mixed = profile === 'mixed-equation', proper = profile.endsWith('-proper');
            const numerator = !mixed && !proper && a === 2 * b + 1 ? 2n : 1n;
            const multiplierDenominator = mixed ? 10 * (b - 1) : 5 * (proper ? b - 1 : 2 * b - 1);
            const quantityDenominator = mixed ? 15 * (c - 1) : profile.startsWith('fraction-partition-')
                ? c === 1 ? 12 : 30 * (c - 1) : 15 * (c - 1);
            expect(Number.isSafeInteger(row.weight) && row.weight > 0).toBe(true);
            expect(BigInt(row.weight) * BigInt(multiplierDenominator) * BigInt(quantityDenominator))
                .toBe(total * numerator);
        }
    });

    for (const contract of ['derivation', 'relation'] as const) {
        it.each(fractionProductProfiles)(`${contract} / %s partitions complete native support before drawing`, profile => {
            const native = fractionProductNativeDomain(profile), seen = new Set<string>();
            const actualBounds = new Set(native.map(row => expectedUpper(row, contract)));
            expect([...actualBounds].sort((a, b) => a - b)).toEqual(fractionProductUpperBounds(contract, profile));
            for (const upper of fractionProductUpperBounds(contract, profile)) {
                const rows = fractionProductDomain(contract, profile, createCanonicalNumericRange(upper));
                const expected = native.filter(row => expectedUpper(row, contract) === upper);
                expect(rows).toEqual(expected);
                const total = rows.reduce((sum, row) => sum + row.weight, 0);
                let preceding = 0;
                for (const row of rows) {
                    expect(selectFractionProductOperands(rows, (preceding + row.weight / 2) / total)).toBe(row);
                    preceding += row.weight;
                    expect(seen.has(key(row))).toBe(false);
                    seen.add(key(row));
                    const fine = buildFractionProduct(row, profile, 'ribbon');
                    const relation = buildFractionProductRelation(row, profile, 'ribbon');
                    const {scaledQuantity, ...partition} = fine.partition;
                    expect(scaledQuantity).toEqual({numerator: fine.multiplierValue.numerator * fine.quantityValue.numerator,
                        denominator: fine.quantityValue.denominator});
                    expect(relation).toEqual({...fine, kind: 'fraction-product-relation', partition});
                    expect(fine).not.toHaveProperty('weight');
                    expect(relation).not.toHaveProperty('weight');
                }
                expect(preceding).toBe(total);
            }
            expect(seen).toEqual(new Set(native.map(key)));
        });
    }

    it('distinguishes an assessed subtotal from storage numerators and an unused available-cell aggregate', () => {
        const operands = {operandForm: 'fractions', multiplier: {form: 'fraction', numerator: 17, denominator: 6},
            quantity: {form: 'fraction', numerator: 6, denominator: 1}} as const;
        expect(expectedUpper(operands, 'derivation')).toBe(120);
        expect(expectedUpper(operands, 'relation')).toBe(20);
        const withoutAggregate = {operandForm: 'fractions', multiplier: {form: 'fraction', numerator: 5, denominator: 2},
            quantity: {form: 'fraction', numerator: 1, denominator: 2}} as const;
        expect(buildFractionProductRelation(withoutAggregate, 'fraction-partition-improper', 'rope').partition.availablePartCount).toBe(6);
        expect(expectedUpper(withoutAggregate, 'relation')).toBe(5);
    });

    it('rejects invalid profiles, canonical bounds and weighted draws', () => {
        const valid = createCanonicalNumericRange(10);
        expect(() => fractionProductNativeDomain('unknown' as never)).toThrow();
        expect(() => fractionProductUpperBounds('unknown' as never, 'mixed-equation')).toThrow();
        expect(() => fractionProductUpperBounds('relation', 'unknown' as never)).toThrow();
        for (const range of [undefined, {...valid, min: 5}, {...valid, max: 120}, {...valid, maximumAbove: 0}, {...valid, minimumBelow: 1}]) {
            expect(() => fractionProductDomain('relation', 'fraction-partition-proper', range as never)).toThrow();
        }
        const rows = fractionProductNativeDomain('fraction-equation-proper');
        for (const draw of [-1, 1, NaN, Infinity]) expect(() => selectFractionProductOperands(rows, draw)).toThrow();
        expect(() => selectFractionProductOperands([], 0)).toThrow();
        expect(selectFractionProductOperands(rows, 0)).toBe(rows[0]);
        expect(selectFractionProductOperands(rows, 1 - Number.EPSILON)).toBe(rows.at(-1));
    });
});
