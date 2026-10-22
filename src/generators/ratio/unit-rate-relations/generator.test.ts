import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {greatestCommonDivisor} from '../helpers.ts';
import {UnitRateRelationsGenerator} from './generator.ts';

const generator = new UnitRateRelationsGenerator();

describe('UnitRateRelationsGenerator', () => {
    it('rejects missing or unsupported ranges', () => {
        for (const config of [null, {}, {range: null}, {range: {min: 0, max: 10}}, {range: {min: -10, max: 20}}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });

    it.each([20, 100])('supplies exact normalization and scaling witnesses within %s', max => {
        const contexts = new Set<string>();
        const rates = new Set<string>();
        const scales = new Set<number>();
        let fractionalRates = 0;
        for (let seed = 0; seed < 150; seed++) {
            setSeed(seed);
            const {data} = generator.generate({range: {min: 0, max}});
            contexts.add(data.context);
            expect(data.kind).toBe('unit-rate');
            const first = data.antecedent.value;
            const second = data.consequent.value;
            expect(first.denominator).toBe(1);
            expect(second.denominator).toBe(1);
            expect(second.numerator).toBeGreaterThan(1);
            expect(data.unitRate.numerator * second.numerator).toBe(first.numerator * data.unitRate.denominator);
            const factor = data.scaleFactor;
            expect(data.scaled.antecedent.numerator * factor.denominator).toBe(first.numerator * factor.numerator * data.scaled.antecedent.denominator);
            expect(data.scaled.consequent.numerator * factor.denominator).toBe(second.numerator * factor.numerator * data.scaled.consequent.denominator);
            for (const value of [first, second, data.unitRate, data.scaled.antecedent, data.scaled.consequent]) {
                expect(value.numerator).toBeGreaterThan(0);
                expect(value.denominator).toBeGreaterThan(0);
                expect(greatestCommonDivisor(value.numerator, value.denominator)).toBe(1);
                expect(value.numerator / value.denominator).toBeLessThan(max);
            }
            expect(data.antecedent.unit).toBe(data.context === 'price' ? 'dollars' : 'kilometers');
            expect(data.consequent.unit).toBe(data.context === 'price' ? 'kilograms' : 'hours');
            scales.add(factor.numerator / factor.denominator);
            rates.add(`${data.unitRate.numerator}/${data.unitRate.denominator}`);
            if (data.unitRate.denominator > 1) fractionalRates++;
            expect(data).not.toHaveProperty('prompt');
            expect(data).not.toHaveProperty('unknown');
        }
        expect(contexts).toEqual(new Set(['price', 'speed']));
        expect(scales).toEqual(new Set([0.5, 2, 3]));
        expect(fractionalRates).toBeGreaterThan(25);
        expect(rates.size).toBeGreaterThan(20);
    });

    it('is reproducible', () => {
        setSeed(99);
        const first = generator.generate({range: {min: 0, max: 100}});
        setSeed(99);
        expect(generator.generate({range: {min: 0, max: 100}})).toEqual(first);
    });
});
