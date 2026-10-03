import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {
    MeasurementConversionPairId,
    MeasurementConversionStoryProblem
} from '../../../types/problems.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {MeasurementConversionGenerator} from '../measurement-conversion/generator.ts';
import {MeasurementConversionProblemsGenerator} from './generator.ts';

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
        const legacyGenerator = new MeasurementConversionGenerator();
        expect(Object.isFrozen(measurementConversionPairSeeds)).toBe(true);
        for (const [unitPair] of pairs) {
            const seedPair = measurementConversionPairSeeds[unitPair];
            expect(Object.isFrozen(seedPair)).toBe(true);
            setSeed(`shared-pair-${unitPair}`);
            const legacy = legacyGenerator.generate({unitPair, numericProfile: 'legacy'}).data;
            setSeed(`shared-pair-${unitPair}`);
            const story = generator.generate({unitPair, numberKind: 'integer'}).data;
            expect(legacy.pair).toEqual(seedPair);
            expect(story.pair).toEqual(seedPair);
            expect(legacy.pair).not.toBe(seedPair);
            expect(story.pair).not.toBe(seedPair);
            expect(legacy.equivalents).toHaveLength(5);
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
            for (let seed = 0; seed < 100; seed++) {
                setSeed(`${unitPair}-${numberKind}-${seed}`);
                const first = generator.generate({unitPair, numberKind});
                expect(first.data.numberKind).toBe(numberKind);
                expect(first.data.pair.factor).toBe(factor);
                expectValidStory(first.data);
                directions.add(first.data.sourceSide);
                setSeed(`${unitPair}-${numberKind}-${seed}`);
                expect(generator.generate({unitPair, numberKind})).toEqual(first);
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
                const story = generator.generate({unitPair, numberKind: 'decimal'}).data;
                if (story.sourceSide !== 'smaller') continue;
                expect(story.conversion.smallerHundredths % 100).toBe(0);
                expect(story.conversion.largerHundredths % 100).not.toBe(0);
                expect(story.additionalTargetHundredths % 100).not.toBe(0);
            }
        }
    });
});
