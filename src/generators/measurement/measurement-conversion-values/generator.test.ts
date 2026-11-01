import {describe, expect, it} from 'vitest';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {MeasurementConversionValuesGenerator} from './generator.ts';
import {conversionValueRangeProfiles, conversionValueTuples} from './numeric-domain.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {vi} from 'vitest';

const rangeFor = (unitPair: typeof pairCases[number][0], numericProfile: 'integer' | 'decimal') =>
    conversionValueRangeProfiles.find(profile => conversionValueTuples(unitPair, numericProfile, profile.range).length)!.range;

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
            const config = Object.freeze({unitPair, numericProfile, range: rangeFor(unitPair, numericProfile)});
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

    it.each(['integer', 'decimal'] as const)('uses one draw within the selected canonical pool for %s', numericProfile => {
        setSeed('conversion-values-continuation');
        random();
        const expectedState = getRandomState();
        setSeed('conversion-values-continuation');
        generator.generate({unitPair: 'pound-ounce', numericProfile, range: rangeFor('pound-ounce', numericProfile)});
        expect(getRandomState()).toBe(expectedState);
    });

    it.each(pairCases)('preserves every ordered-distinct value pair across the canonical profiles for %s', (unitPair, factor) => {
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const numericProfile of ['integer', 'decimal'] as const) {
                const candidates = numericProfile === 'integer'
                    ? Array.from({length: 8}, (_, i) => (i + 2) * 100)
                    : Array.from({length: 5}, (_, whole) => [1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99]
                        .map(fraction => whole * 100 + fraction)).flat();
                const expected = new Set(candidates.flatMap(a => candidates.filter(b => a !== b).map(b => `${a}:${b}`)));
                const seen = new Set<string>();
                for (const {range} of conversionValueRangeProfiles) {
                    const tuples = conversionValueTuples(unitPair, numericProfile, range);
                    for (let index = 0; index < tuples.length; index++) {
                        draw.mockClear().mockReturnValue((index + 0.5) / tuples.length);
                        const {data} = generator.generate({unitPair, numericProfile, range});
                        const values = [1, factor, ...data.numericExamples.equalities.flatMap(row =>
                            [row.largerHundredths / 100, row.smallerHundredths / 100])];
                        expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                        expect(draw).toHaveBeenCalledTimes(1);
                        const key = data.numericExamples.equalities.map(row => row.largerHundredths).join(':');
                        expect(seen.has(key)).toBe(false);
                        seen.add(key);
                    }
                }
                expect(seen).toEqual(expected);
            }
        } finally { draw.mockRestore(); }
    });

    it.each([undefined, createCanonicalNumericRange(20), createCanonicalNumericRange(100, 5),
        {...createCanonicalNumericRange(100), maximumAbove: 0}])('rejects unsupported integer conversion range %j before drawing', range => {
        const draw = vi.spyOn(rng, 'random');
        try {
            expect(() => generator.generate({unitPair: 'pound-ounce', numericProfile: 'integer', range})).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });
});
