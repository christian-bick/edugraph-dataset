import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {MeasurementUnitEquivalencesGenerator} from './generator.ts';
import {unitEquivalenceRanges, unitEquivalenceStarts} from '../unit-equivalence-domain.ts';

afterEach(() => vi.restoreAllMocks());

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
            expect(() => generator.generate({unitPair, range: createCanonicalNumericRange(1000)} as never))
                .toThrow(`Unsupported unit pair "${unitPair}".`);
        }
    });

    it.each(pairCases)('returns only a deterministic five-row integer sequence for %s', (unitPair, factor) => {
        for (let seed = 0; seed < 20; seed++) {
            const ranges = unitEquivalenceRanges('sequence', unitPair);
            const config = Object.freeze({unitPair, range: ranges[seed % ranges.length]!});
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
        generator.generate({unitPair: 'kilometer-meter', range: createCanonicalNumericRange(10000)});
        expect(getRandomState()).toBe(expectedState);
    });

    it.each(pairCases)('retains every native sequence across all range cells for %s', (unitPair, factor) => {
        const draw = vi.spyOn(rng, 'random'), seen = new Set<number>();
        for (const range of unitEquivalenceRanges('sequence', unitPair)) {
            const starts = unitEquivalenceStarts('sequence', unitPair, range);
            for (const [index, start] of starts.entries()) {
                draw.mockReturnValueOnce((index + 0.5) / starts.length);
                const result = generator.generate({unitPair, range});
                expect(result).toEqual({data: {pair: measurementConversionPairSeeds[unitPair],
                    equivalents: Array.from({length: 5}, (_, offset) => ({largerValue: start + offset,
                        smallerValue: (start + offset) * factor}))}});
                seen.add(start);
            }
        }
        expect(seen).toEqual(new Set([2, 3, 4, 5, 6, 7, 8, 9]));
        expect(draw).toHaveBeenCalledTimes(8);
    });

    it('rejects absent and infeasible ranges', () => {
        expect(() => generator.generate({unitPair: 'hour-minute'})).toThrow(/Required field "range"/);
        expect(() => generator.generate({unitPair: 'hour-minute', range: createCanonicalNumericRange(120)})).toThrow();
    });
});
