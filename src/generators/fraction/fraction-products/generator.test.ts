import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {setSeed} from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {fractionProductDomain, fractionProductUpperBounds} from '../fraction-product-domain.ts';
import type {FractionProductProblem, FractionProductValue} from '../../../types/problems.ts';
import {FractionProductsGenerator} from './generator.ts';
import type {FractionProductsGeneratorConfig} from './spec.ts';

const generator = new FractionProductsGenerator();
const profiles = ['fraction-partition-proper', 'fraction-partition-improper',
    'fraction-equation-proper', 'fraction-equation-improper', 'mixed-equation'] as const;
type Profile = typeof profiles[number];
afterEach(() => vi.restoreAllMocks());

const sample = (productProfile: Profile, seed: string): FractionProductProblem => {
    setSeed(seed);
    const bounds = fractionProductUpperBounds('derivation', productProfile);
    const index = Number.parseInt(seed.split('-').at(-1)!, 10) || 0;
    return generator.generate({productProfile, range: createCanonicalNumericRange(bounds[index % bounds.length]!)}).data;
};

const equals = (first: FractionProductValue, second: FractionProductValue): boolean =>
    BigInt(first.numerator) * BigInt(second.denominator)
        === BigInt(second.numerator) * BigInt(first.denominator);

const positiveRational = ({numerator, denominator}: FractionProductValue): boolean =>
    Number.isSafeInteger(numerator) && numerator > 0
        && Number.isSafeInteger(denominator) && denominator > 0;

describe('fraction-products exact multiplication', () => {
    it.each(profiles)('%s honors every canonical cell and both material choices', productProfile => {
        const random = vi.spyOn(rng, 'random');
        for (const upper of fractionProductUpperBounds('derivation', productProfile)) {
            const range = createCanonicalNumericRange(upper), rows = fractionProductDomain('derivation', productProfile, range);
            for (const [draw, expected] of [[0, rows[0]!], [1 - Number.EPSILON, rows.at(-1)!]] as const) {
                for (const material of [0.25, 0.75]) {
                    random.mockReturnValueOnce(draw).mockReturnValueOnce(material);
                    const stub = generator.generate({productProfile, range}), data = stub.data;
                    expect(Object.keys(stub)).toEqual(['data']);
                    expect(data.multiplier).toEqual(expected.multiplier);
                    expect(data.quantity).toEqual(expected.quantity);
                    expect(data).not.toHaveProperty('weight');
                    expect(data.context.material).toBe(material < 0.5 ? 'ribbon' : 'rope');
                    const {numerator: a, denominator: b} = data.multiplierValue, {numerator: q, denominator: c} = data.quantityValue;
                    expect(data.partition.scaledQuantity).toEqual({numerator: a * q, denominator: c});
                    const maximum = Math.max(a / b, q / c, a * q / (b * c), q / (b * c), a, b, Math.ceil(a / b), a * q / c);
                    expect(maximum).toBeGreaterThan(range.maximumAbove);
                    expect(maximum).toBeLessThanOrEqual(range.max);
                }
            }
        }
    });
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

            expect(data.equationWitness !== undefined).toBe(!profile.startsWith('fraction-partition'));
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
            sample(seed % 2 ? 'fraction-partition-proper' : 'fraction-partition-improper', `partition-coverage-${seed}`));
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
            const fraction = sample(seed % 2 ? 'fraction-equation-proper' : 'fraction-equation-improper', `fraction-word-${seed}`);
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
        expect(() => generator.generate({productProfile: 'unknown', range: createCanonicalNumericRange(5)} as unknown as
            FractionProductsGeneratorConfig)).toThrow(/supported.*profile/i);
        for (const config of [null, undefined, {productProfile: 'mixed-equation'}, {range: createCanonicalNumericRange(5)},
            {productProfile: 'fraction-equation-proper', range: createCanonicalNumericRange(100)},
            {productProfile: 'mixed-equation', range: {...createCanonicalNumericRange(10), minimumBelow: 0}}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });
});
