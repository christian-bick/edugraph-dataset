import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {FractionProductProblem, FractionProductValue} from '../../../types/problems.ts';
import {FractionProductsGenerator} from './generator.ts';
import type {FractionProductsGeneratorConfig} from './spec.ts';

const generator = new FractionProductsGenerator();
const profiles = ['fraction-partition', 'fraction-equation', 'mixed-equation'] as const;
type Profile = typeof profiles[number];

const sample = (productProfile: Profile, seed: string): FractionProductProblem => {
    setSeed(seed);
    return generator.generate({productProfile}).data;
};

const equals = (first: FractionProductValue, second: FractionProductValue): boolean =>
    BigInt(first.numerator) * BigInt(second.denominator)
        === BigInt(second.numerator) * BigInt(first.denominator);

const positiveRational = ({numerator, denominator}: FractionProductValue): boolean =>
    Number.isSafeInteger(numerator) && numerator > 0
        && Number.isSafeInteger(denominator) && denominator > 0;

describe('fraction-products exact multiplication', () => {
    it.each(profiles)('preserves original operands and complete partition math in %s', profile => {
        const seen = new Set<string>();
        for (let seed = 0; seed < 160; seed++) {
            const data = sample(profile, `${profile}-${seed}`);
            seen.add(JSON.stringify([data.multiplierValue, data.quantityValue, data.context.material]));
            expect(data.kind).toBe('fraction-product');
            expect(data.sharedWhole).toBe(1);
            expect(data.context.measureUnit).toBe('meter');
            expect(['ribbon', 'rope']).toContain(data.context.material);
            for (const item of [data.multiplierValue, data.quantityValue, data.product,
                data.partition.onePartValue, data.partition.scaledQuantity]) {
                expect(positiveRational(item)).toBe(true);
            }

            const {numerator: a, denominator: b} = data.multiplierValue;
            const {numerator: q, denominator: qDenominator} = data.quantityValue;
            expect(b).toBeGreaterThanOrEqual(2);
            expect(b).toBeLessThanOrEqual(6);
            expect(a).toBeGreaterThanOrEqual(1);
            expect(a).toBeLessThan(3 * b);
            expect(qDenominator).toBeLessThanOrEqual(6);
            expect(q).toBeLessThanOrEqual(6 * qDenominator);
            expect(data.partition).toMatchObject({
                equalPartsPerCopy: b,
                selectedPartCount: a,
                copyCount: Math.ceil(a / b),
                availablePartCount: Math.ceil(a / b) * b,
                onePartValue: {numerator: q, denominator: qDenominator * b},
                scaledQuantity: {numerator: a * q, denominator: qDenominator}
            });
            expect(data.partition.copyCount).toBeGreaterThanOrEqual(1);
            expect(data.partition.copyCount).toBeLessThanOrEqual(3);
            expect(data.partition.availablePartCount).toBeLessThanOrEqual(18);
            expect(data.partition.selectedPartCount)
                .toBeLessThanOrEqual(data.partition.availablePartCount);
            expect(data.product).toEqual({numerator: a * q, denominator: b * qDenominator});
            expect(equals(data.product, {
                numerator: data.partition.selectedPartCount * data.partition.onePartValue.numerator,
                denominator: data.partition.onePartValue.denominator
            })).toBe(true);
            expect(equals(data.product, {
                numerator: data.partition.scaledQuantity.numerator,
                denominator: data.partition.scaledQuantity.denominator * b
            })).toBe(true);

            if (data.operandForm === 'fractions') {
                expect(data.multiplier).toEqual({form: 'fraction', numerator: a, denominator: b});
                expect(data.quantity).toEqual({form: 'fraction', numerator: q,
                    denominator: qDenominator});
            } else {
                expect(data.multiplier.improperNumerator).toBe(a);
                expect(data.quantity.improperNumerator).toBe(q);
                for (const operand of [data.multiplier, data.quantity]) {
                    expect(operand.form).toBe('mixed');
                    expect(operand.whole).toBeGreaterThanOrEqual(1);
                    expect(operand.fractionNumerator).toBeGreaterThan(0);
                    expect(operand.fractionNumerator).toBeLessThan(operand.denominator);
                    expect(operand.improperNumerator)
                        .toBe(operand.whole * operand.denominator + operand.fractionNumerator);
                }
            }

            expect(data.equationWitness !== undefined).toBe(profile !== 'fraction-partition');
            if (data.equationWitness) {
                expect(data.equationWitness).toEqual({
                    factor: data.multiplierValue,
                    referenceMeasure: data.quantityValue,
                    productMeasure: data.product,
                    measureUnit: 'meter'
                });
            }
        }
        expect(seen.size).toBeGreaterThan(25);
    });

    it('covers proper and improper partition factors with whole and fractional q', () => {
        const cases = Array.from({length: 240}, (_, seed) =>
            sample('fraction-partition', `partition-coverage-${seed}`));
        expect(cases.some(data => data.multiplierValue.numerator
            < data.multiplierValue.denominator)).toBe(true);
        expect(cases.some(data => data.multiplierValue.numerator
            > data.multiplierValue.denominator)).toBe(true);
        expect(cases.some(data => data.multiplierValue.numerator
            > 2 * data.multiplierValue.denominator)).toBe(true);
        expect(cases.some(data => data.quantityValue.denominator === 1)).toBe(true);
        expect(cases.some(data => data.quantityValue.denominator > 1
            && data.quantityValue.numerator % data.quantityValue.denominator !== 0)).toBe(true);
    });

    it('keeps word-problem operand forms genuinely fractional and genuinely mixed', () => {
        for (let seed = 0; seed < 120; seed++) {
            const fraction = sample('fraction-equation', `fraction-word-${seed}`);
            const mixed = sample('mixed-equation', `mixed-word-${seed}`);
            expect(fraction.operandForm).toBe('fractions');
            expect(fraction.multiplierValue.numerator % fraction.multiplierValue.denominator)
                .not.toBe(0);
            expect(fraction.quantityValue.numerator % fraction.quantityValue.denominator)
                .not.toBe(0);
            expect(mixed.operandForm).toBe('mixed-numbers');
            expect(mixed.multiplierValue.numerator)
                .toBeGreaterThan(mixed.multiplierValue.denominator);
            expect(mixed.quantityValue.numerator)
                .toBeGreaterThan(mixed.quantityValue.denominator);
        }
    });

    it('replays deterministically and rejects missing or unsupported profiles', () => {
        for (const profile of profiles) {
            expect(sample(profile, `replay-${profile}`)).toEqual(sample(profile, `replay-${profile}`));
        }
        expect(() => generator.generate({} as FractionProductsGeneratorConfig))
            .toThrow(/Required field "productProfile"/);
        expect(() => generator.generate({productProfile: 'unknown'} as unknown as
            FractionProductsGeneratorConfig)).toThrow(/Unsupported product profile/);
    });
});
