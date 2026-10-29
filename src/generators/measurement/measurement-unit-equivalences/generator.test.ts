import {describe, expect, it} from 'vitest';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {MeasurementUnitEquivalencesGenerator} from './generator.ts';

const pairCases = [
    ['kilometer-meter', 1000],
    ['meter-centimeter', 100],
    ['kilogram-gram', 1000],
    ['pound-ounce', 16],
    ['liter-milliliter', 1000],
    ['hour-minute', 60],
    ['minute-second', 60]
] as const;

describe('MeasurementUnitEquivalencesGenerator', () => {
    const generator = new MeasurementUnitEquivalencesGenerator();

    it('requires a supported unit pair', () => {
        expect(() => generator.generate({})).toThrow('Required field "unitPair" is missing.');
        expect(() => generator.generate(null as never)).toThrow('Configuration object is missing or null.');
        for (const unitPair of ['yard-foot', 'constructor', 'toString', '__proto__']) {
            expect(() => generator.generate({unitPair} as never))
                .toThrow(`Unsupported unit pair "${unitPair}".`);
        }
    });

    it.each(pairCases)('returns only a deterministic five-row integer sequence for %s', (unitPair, factor) => {
        const config = Object.freeze({unitPair});
        for (let seed = 0; seed < 20; seed++) {
            setSeed(`${unitPair}-${seed}`);
            const problem = generator.generate(config);
            expect(Object.keys(problem.data)).toEqual(['pair', 'equivalents']);
            expect(problem.data.pair).toEqual(measurementConversionPairSeeds[unitPair]);
            expect(problem.data.pair).not.toBe(measurementConversionPairSeeds[unitPair]);
            const start = problem.data.equivalents[0]!.largerValue;
            expect(start).toBeGreaterThanOrEqual(2);
            expect(start).toBeLessThanOrEqual(9);
            expect(problem.data.equivalents).toEqual(Array.from({length: 5}, (_, index) => ({
                largerValue: start + index,
                smallerValue: (start + index) * factor
            })));
            setSeed(`${unitPair}-${seed}`);
            expect(generator.generate(config)).toEqual(problem);
        }
    });

    it('uses exactly one starting-row draw', () => {
        setSeed('unit-equivalence-continuation');
        random();
        const expectedState = getRandomState();
        setSeed('unit-equivalence-continuation');
        generator.generate({unitPair: 'kilometer-meter'});
        expect(getRandomState()).toBe(expectedState);
    });
});
