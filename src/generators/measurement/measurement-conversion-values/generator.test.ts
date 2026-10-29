import {describe, expect, it} from 'vitest';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {MeasurementConversionValuesGenerator} from './generator.ts';

const pairCases = [
    ['kilometer-meter', 1000],
    ['meter-centimeter', 100],
    ['kilogram-gram', 1000],
    ['pound-ounce', 16],
    ['liter-milliliter', 1000],
    ['hour-minute', 60],
    ['minute-second', 60]
] as const;

describe('MeasurementConversionValuesGenerator', () => {
    const generator = new MeasurementConversionValuesGenerator();

    it('requires a supported unit pair and an explicit integer or decimal profile', () => {
        expect(() => generator.generate({})).toThrow('Required field "unitPair" is missing.');
        expect(() => generator.generate(null as never)).toThrow('Configuration object is missing or null.');
        expect(() => generator.generate({unitPair: 'kilometer-meter'}))
            .toThrow('Required field "numericProfile" is missing.');
        for (const unitPair of ['yard-foot', 'constructor', 'toString', '__proto__']) {
            expect(() => generator.generate({unitPair, numericProfile: 'integer'} as never))
                .toThrow(`Unsupported unit pair "${unitPair}".`);
        }
        for (const numericProfile of ['legacy', 'fraction']) {
            expect(() => generator.generate({unitPair: 'kilometer-meter', numericProfile} as never))
                .toThrow(`Unsupported numeric profile "${numericProfile}".`);
        }
    });

    it.each(pairCases)('returns only exact, distinct numeric equalities for %s', (unitPair, factor) => {
        for (const numericProfile of ['integer', 'decimal'] as const) {
            const config = Object.freeze({unitPair, numericProfile});
            for (let seed = 0; seed < 20; seed++) {
                setSeed(`${unitPair}-${numericProfile}-${seed}`);
                const problem = generator.generate(config);
                expect(Object.keys(problem.data)).toEqual(['pair', 'numericExamples']);
                expect(problem.data.pair).toEqual(measurementConversionPairSeeds[unitPair]);
                expect(problem.data.pair).not.toBe(measurementConversionPairSeeds[unitPair]);
                const examples = problem.data.numericExamples;
                expect(examples.numberKind).toBe(numericProfile);
                expect(examples.equalities).toHaveLength(2);
                expect(examples.equalities[0].largerHundredths).not.toBe(examples.equalities[1].largerHundredths);
                for (const equality of examples.equalities) {
                    expect(Number.isSafeInteger(equality.largerHundredths)).toBe(true);
                    expect(Number.isSafeInteger(equality.smallerHundredths)).toBe(true);
                    expect(equality.largerHundredths).toBeGreaterThan(0);
                    expect(equality.smallerHundredths).toBe(equality.largerHundredths * factor);
                    expect(equality.smallerHundredths).toBeLessThanOrEqual(900000);
                    expect(equality.largerHundredths % 100 === 0).toBe(numericProfile === 'integer');
                }
                setSeed(`${unitPair}-${numericProfile}-${seed}`);
                expect(generator.generate(config)).toEqual(problem);
            }
        }
    });

    it.each(['integer', 'decimal'] as const)('uses only the two equality draws for %s', numericProfile => {
        setSeed('conversion-values-continuation');
        random();
        random();
        const expectedState = getRandomState();
        setSeed('conversion-values-continuation');
        generator.generate({unitPair: 'pound-ounce', numericProfile});
        expect(getRandomState()).toBe(expectedState);
    });
});
