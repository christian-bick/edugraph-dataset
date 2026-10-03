import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {FractionProductProblem} from '../../../types/problems.ts';
import {FractionProductsGenerator} from '../../../generators/fraction/fraction-products/generator.ts';
import {formatProductOperand, isValidFractionProduct} from './fraction-product-helpers.ts';

const generator = new FractionProductsGenerator();
const profiles = ['fraction-partition', 'fraction-equation', 'mixed-equation'] as const;
const sample = (productProfile: typeof profiles[number]) => {
    setSeed(`fraction-product-view-${productProfile}`);
    return generator.generate({productProfile}).data;
};

describe('fraction product view contract', () => {
    it('accepts all producer profiles across proper, improper, fractional-q, whole-q, and mixed cases', () => {
        let sawProper = false;
        let sawImproper = false;
        let sawFractionalQuantity = false;
        let sawWholeQuantity = false;
        for (const productProfile of profiles) {
            for (let seed = 0; seed < 100; seed++) {
                setSeed(`fraction-product-contract-${productProfile}-${seed}`);
                const data = generator.generate({productProfile}).data;
                expect(isValidFractionProduct(data)).toBe(true);
                sawProper ||= data.multiplierValue.numerator < data.multiplierValue.denominator;
                sawImproper ||= data.multiplierValue.numerator > data.multiplierValue.denominator;
                sawFractionalQuantity ||= data.quantityValue.denominator > 1;
                sawWholeQuantity ||= data.quantityValue.denominator === 1;
            }
        }
        expect([sawProper, sawImproper, sawFractionalQuantity, sawWholeQuantity]).toEqual([true, true, true, true]);
    });

    it('rejects wrong selected parts, q-part size, product, original notation, or contextual equation', () => {
        const base = sample('fraction-equation');
        expect(isValidFractionProduct({...base, partition: {...base.partition,
            selectedPartCount: base.partition.selectedPartCount + 1}})).toBe(false);
        expect(isValidFractionProduct({...base, partition: {...base.partition,
            onePartValue: {numerator: 9, denominator: 1}}})).toBe(false);
        expect(isValidFractionProduct({...base, product: {numerator: 9, denominator: 1}})).toBe(false);
        expect(isValidFractionProduct({...base, quantityValue: {
            numerator: 2 * base.quantityValue.numerator,
            denominator: 2 * base.quantityValue.denominator
        }})).toBe(false);
        expect(isValidFractionProduct({...base, equationWitness: {...base.equationWitness!,
            productMeasure: {numerator: 9, denominator: 1}}})).toBe(false);
        expect(isValidFractionProduct({...base, context: {...base.context,
            measureUnit: 'inch'}} as unknown as FractionProductProblem)).toBe(false);
    });

    it('formats original mixed notation without silently converting it in the prompt', () => {
        const data = sample('mixed-equation');
        expect(data.operandForm).toBe('mixed-numbers');
        expect(formatProductOperand(data.multiplier)).toMatch(/^\d+ \d+\/\d+$/);
        expect(formatProductOperand(data.quantity)).toMatch(/^\d+ \d+\/\d+$/);
    });
});
