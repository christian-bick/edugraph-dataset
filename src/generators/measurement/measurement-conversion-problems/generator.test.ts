import {describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {
    MeasurementConversionPairId,
    MeasurementConversionStoryProblem
} from '../../../types/problems.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {MeasurementUnitEquivalencesGenerator} from '../measurement-unit-equivalences/generator.ts';
import {unitEquivalenceRanges} from '../unit-equivalence-domain.ts';
import {MeasurementConversionProblemsGenerator} from './generator.ts';
import {conversionStoryRangeProfiles, conversionStoryTuples} from './numeric-domain.ts';

const rangesFor = (unitPair: MeasurementConversionPairId, numberKind: 'integer' | 'decimal') =>
    conversionStoryRangeProfiles.filter(profile => conversionStoryTuples(unitPair, numberKind, profile.range).length);

const pairs = [
    ['kilometer-meter', 'length', 'magnitude', 'kilometer', 'meter', 1000],
    ['meter-centimeter', 'length', 'magnitude', 'meter', 'centimeter', 100],
    ['kilogram-gram', 'weight', 'magnitude', 'kilogram', 'gram', 1000],
    ['pound-ounce', 'weight', 'factor', 'pound', 'ounce', 16],
    ['liter-milliliter', 'liquid-volume', 'magnitude', 'liter', 'milliliter', 1000],
    ['hour-minute', 'time', 'factor', 'hour', 'minute', 60],
    ['minute-second', 'time', 'factor', 'minute', 'second', 60]
] as const;

const expectValidStory = (problem: MeasurementConversionStoryProblem): void => {
    const pair = pairs.find(([id]) => id === problem.pair.id)!;
    expect(problem.kind).toBe('measurement-conversion-story');
    expect([
        problem.pair.id, problem.pair.quantityKind, problem.pair.scalingKind,
        problem.pair.largerUnit, problem.pair.smallerUnit, problem.pair.factor
    ]).toEqual(pair);
    expect(['larger', 'smaller']).toContain(problem.sourceSide);

    const {largerHundredths, smallerHundredths} = problem.conversion;
    const converted = problem.sourceSide === 'larger'
        ? smallerHundredths
        : largerHundredths;
    for (const count of [
        largerHundredths, smallerHundredths,
        problem.additionalTargetHundredths, problem.totalTargetHundredths
    ]) {
        expect(Number.isSafeInteger(count)).toBe(true);
        expect(count).toBeGreaterThan(0);
        expect(count).toBeLessThan(1_000_000);
    }
    expect(smallerHundredths).toBe(largerHundredths * problem.pair.factor);
    expect(problem.totalTargetHundredths)
        .toBe(converted + problem.additionalTargetHundredths);
    expect(problem.totalTargetHundredths).toBeGreaterThan(converted);

    if (problem.numberKind === 'integer') {
        for (const count of [
            largerHundredths, smallerHundredths,
            problem.additionalTargetHundredths, problem.totalTargetHundredths
        ]) expect(count % 100).toBe(0);
    } else {
        expect(largerHundredths % 100).not.toBe(0);
        expect(problem.additionalTargetHundredths % 100).not.toBe(0);
    }
};

describe('MeasurementConversionProblemsGenerator', () => {
    const generator = new MeasurementConversionProblemsGenerator();

    it('shares immutable pair facts while both generators return detached payloads', () => {
        const sequenceGenerator = new MeasurementUnitEquivalencesGenerator();
        expect(Object.isFrozen(measurementConversionPairSeeds)).toBe(true);
        for (const [unitPair] of pairs) {
            const seedPair = measurementConversionPairSeeds[unitPair];
            expect(Object.isFrozen(seedPair)).toBe(true);
            setSeed(`shared-pair-${unitPair}`);
            const sequence = sequenceGenerator.generate({unitPair, range: unitEquivalenceRanges('sequence', unitPair)[0]!}).data;
            setSeed(`shared-pair-${unitPair}`);
            const story = generator.generate({unitPair, numberKind: 'integer', range: rangesFor(unitPair, 'integer')[0]!.range}).data;
            expect(sequence.pair).toEqual(seedPair);
            expect(story.pair).toEqual(seedPair);
            expect(sequence.pair).not.toBe(seedPair);
            expect(story.pair).not.toBe(seedPair);
            expect(sequence.equivalents).toHaveLength(5);
        }
    });

    it('strictly validates both config fields', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({unitPair: 'kilometer-meter'})).toThrow();
        expect(() => generator.generate({unitPair: 'yard-foot', numberKind: 'integer'} as never))
            .toThrow('Unsupported unit pair "yard-foot".');
        expect(() => generator.generate({unitPair: 'kilometer-meter', numberKind: 'fraction'} as never))
            .toThrow('Unsupported number kind "fraction".');
    });

    it.each(pairs)('builds exact two-step stories for %s', (unitPair, _kind, _scaling, _large, _small, factor) => {
        for (const numberKind of ['integer', 'decimal'] as const) {
            const directions = new Set<MeasurementConversionStoryProblem['sourceSide']>();
            for (const {range} of rangesFor(unitPair, numberKind)) for (let seed = 0; seed < 100; seed++) {
                setSeed(`${unitPair}-${numberKind}-${seed}`);
                const first = generator.generate({unitPair, numberKind, range});
                expect(first.data.numberKind).toBe(numberKind);
                expect(first.data.pair.factor).toBe(factor);
                expectValidStory(first.data);
                directions.add(first.data.sourceSide);
                setSeed(`${unitPair}-${numberKind}-${seed}`);
                expect(generator.generate({unitPair, numberKind, range})).toEqual(first);
            }
            expect(directions).toEqual(new Set(['larger', 'smaller']));
        }
    });

    it('retains decimal given information when a factor forces an integral smaller-unit source', () => {
        for (const unitPair of [
            'kilometer-meter', 'meter-centimeter', 'kilogram-gram', 'liter-milliliter'
        ] as const satisfies readonly MeasurementConversionPairId[]) {
            for (let seed = 0; seed < 100; seed++) {
                setSeed(`reverse-decimal-${unitPair}-${seed}`);
                const story = generator.generate({unitPair, numberKind: 'decimal', range: rangesFor(unitPair, 'decimal')[0]!.range}).data;
                if (story.sourceSide !== 'smaller') continue;
                expect(story.conversion.smallerHundredths % 100).toBe(0);
                expect(story.conversion.largerHundredths % 100).not.toBe(0);
                expect(story.additionalTargetHundredths % 100).not.toBe(0);
            }
        }
    });

    it.each(pairs)('preserves all finite story quantities across canonical profiles for %s', (unitPair, _kind, _scale, _large, _small, factor) => {
        const draw = vi.spyOn(rng, 'random');
        try {
            for (const numberKind of ['integer', 'decimal'] as const) {
                const candidates = numberKind === 'integer' ? Array.from({length: 8}, (_, i) => (i + 2) * 100)
                    : Array.from({length: 5}, (_, whole) => [1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99]
                        .map(fraction => whole * 100 + fraction)).flat();
                const expected = new Set<string>();
                for (const side of ['larger', 'smaller']) for (const larger of candidates) for (let whole = 1; whole <= 5; whole++) {
                    for (const fraction of numberKind === 'integer' ? [0] : [25, 50, 75]) {
                        const scale = side === 'larger' ? Math.max(1, Math.floor(factor / 10)) : 1;
                        expected.add([side, larger, whole * scale * 100 + fraction].join(':'));
                    }
                }
                const seen = new Set<string>();
                for (const {range} of rangesFor(unitPair, numberKind)) {
                    const tuples = conversionStoryTuples(unitPair, numberKind, range);
                    for (let index = 0; index < tuples.length; index++) {
                        draw.mockClear().mockReturnValue((index + 0.5) / tuples.length);
                        const {data} = generator.generate({unitPair, numberKind, range});
                        const values = [1, factor, data.conversion.largerHundredths / 100,
                            data.conversion.smallerHundredths / 100, data.additionalTargetHundredths / 100,
                            data.totalTargetHundredths / 100];
                        expect(hasCanonicalRangeWitness(values, range)).toBe(true);
                        expect(draw).toHaveBeenCalledTimes(1);
                        const key = [data.sourceSide, data.conversion.largerHundredths, data.additionalTargetHundredths].join(':');
                        expect(seen.has(key)).toBe(false);
                        seen.add(key);
                    }
                }
                expect(seen).toEqual(expected);
            }
        } finally { draw.mockRestore(); }
    });

    it.each([undefined, createCanonicalNumericRange(20), createCanonicalNumericRange(1000, 5),
        {...createCanonicalNumericRange(10000), maximumAbove: 0}])('rejects missing or infeasible story range %j before drawing', range => {
        const draw = vi.spyOn(rng, 'random');
        try {
            expect(() => generator.generate({unitPair: 'kilometer-meter', numberKind: 'integer', range})).toThrow();
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });
});
