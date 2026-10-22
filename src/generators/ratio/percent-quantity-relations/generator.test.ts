import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {greatestCommonDivisor} from '../helpers.ts';
import {PercentQuantityRelationsGenerator} from './generator.ts';

const generator = new PercentQuantityRelationsGenerator();

describe('PercentQuantityRelationsGenerator', () => {
    it('requires a resolved and supported mathematical range', () => {
        for (const config of [
            null, {}, {range: null}, {range: 1000}, {range: {}},
            {range: {min: 1, max: 1000}}, {range: {min: -1, max: 1000}},
            {range: {min: 0, max: 100}}, {range: {min: 0, max: Infinity}}
        ]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });

    it.each([1000, 10000, Number.MAX_SAFE_INTEGER])(
        'preserves exact percent, forward and inverse relations within range %s', max => {
            const bound = max === Number.MAX_SAFE_INTEGER ? 1000 : max;
            const percentProfiles = new Set<string>();
            const wholeProfiles = new Set<string>();
            const partProfiles = new Set<string>();
            const problems = new Set<string>();
            for (let seed = 0; seed < 300; seed++) {
                setSeed(seed);
                const {data} = generator.generate({range: {min: 0, max}});
                expect(data.kind).toBe('percent-quantity');
                expect(Number.isSafeInteger(data.percent)).toBe(true);
                expect(data.percent).toBeGreaterThanOrEqual(1);
                expect(data.percent).toBeLessThanOrEqual(150);
                expect(data.perHundred).toEqual({numerator: data.percent, denominator: 100});
                expect(data.scaleFactor.numerator * 100).toBe(data.percent * data.scaleFactor.denominator);
                const {whole, part, scaleFactor} = data;
                expect(part.numerator * whole.denominator * scaleFactor.denominator)
                    .toBe(whole.numerator * scaleFactor.numerator * part.denominator);
                expect(whole.numerator * part.denominator * scaleFactor.numerator)
                    .toBe(part.numerator * scaleFactor.denominator * whole.denominator);
                for (const value of [whole, part, scaleFactor]) {
                    expect(Number.isSafeInteger(value.numerator)).toBe(true);
                    expect(Number.isSafeInteger(value.denominator)).toBe(true);
                    expect(value.numerator).toBeGreaterThan(0);
                    expect(value.denominator).toBeGreaterThan(0);
                    expect(greatestCommonDivisor(value.numerator, value.denominator)).toBe(1);
                    expect(value.numerator).toBeLessThan(bound);
                    expect(value.denominator).toBeLessThan(bound);
                    expect(value.numerator / value.denominator).toBeLessThan(bound);
                }
                expect(whole.numerator * scaleFactor.numerator).toBeLessThan(bound);
                expect(whole.denominator * scaleFactor.denominator).toBeLessThan(bound);
                if (data.percent === 100) expect(part).toEqual(whole);
                const relation = Math.sign(part.numerator * whole.denominator - whole.numerator * part.denominator);
                expect(relation).toBe(Math.sign(data.percent - 100));
                percentProfiles.add(data.percent < 100 ? 'less' : data.percent === 100 ? 'equal' : 'greater');
                wholeProfiles.add(whole.denominator === 1 ? 'integer' : 'fractional');
                partProfiles.add(part.denominator === 1 ? 'integer' : 'fractional');
                problems.add(JSON.stringify(data));
                expect(Object.keys(data).sort()).toEqual(['kind', 'part', 'perHundred', 'percent', 'scaleFactor', 'whole']);
            }
            expect(percentProfiles).toEqual(new Set(['less', 'equal', 'greater']));
            expect(wholeProfiles).toEqual(new Set(['integer', 'fractional']));
            expect(partProfiles).toEqual(new Set(['integer', 'fractional']));
            expect(problems.size).toBeGreaterThan(250);
        }
    );

    it('makes the magnitude configuration change the sampled quantities', () => {
        let largeNumerators = 0;
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const smaller = generator.generate({range: {min: 0, max: 1000}}).data;
            setSeed(seed);
            const larger = generator.generate({range: {min: 0, max: 10000}}).data;
            expect(larger.percent).toBe(smaller.percent);
            expect(larger.whole.numerator / larger.whole.denominator)
                .toBeGreaterThan(smaller.whole.numerator / smaller.whole.denominator);
            if (larger.whole.numerator >= 1000 || larger.part.numerator >= 1000) largeNumerators++;
        }
        expect(largeNumerators).toBeGreaterThan(40);
    });

    it('reproduces the same relation with the same seed and config', () => {
        setSeed(88);
        const first = generator.generate({range: {min: 0, max: 1000}});
        setSeed(88);
        expect(generator.generate({range: {min: 0, max: 1000}})).toEqual(first);
    });
});
