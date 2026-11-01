import {describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {rational} from '../../ratio/helpers.ts';
import {measurementConversionPairSeeds} from '../helpers.ts';
import {conversionProjection, isMeasurementRatioRelation} from '../../../visuals/views/measure/measurement-ratio-presentation.ts';
import {MeasurementRatioRelationsGenerator} from './generator.ts';
import {conversionRatioCaseCount, conversionRatioDomainFootprint, conversionRatioFrameAt, conversionRatioRangeProfiles} from './numeric-domain.ts';

describe('MeasurementRatioRelationsGenerator', () => {
    it('preserves every original unit-fact and scale draw, including equal reduced-rational outcomes', () => {
        const facts = [...Object.values(measurementConversionPairSeeds).map(pair => ({
            first: pair.largerUnit, second: pair.smallerUnit, firstValue: 1, secondValue: pair.factor
        })), {first: 'inch', second: 'centimeter', firstValue: 50, secondValue: 127}];
        const expected = new Map<string, number>(), seen = new Map<string, number>();
        for (const fact of facts) for (let numerator = 1; numerator <= Math.floor(99999 / Math.max(fact.firstValue, fact.secondValue)); numerator++) {
            for (const denominator of [1, 2, 4]) {
                const scale = rational(numerator, denominator);
                const key = [fact.first, fact.second, scale.numerator, scale.denominator].join(':');
                expected.set(key, (expected.get(key) ?? 0) + 1);
            }
        }
        const generator = new MeasurementRatioRelationsGenerator(), draw = vi.spyOn(rng, 'random');
        let cases = 0;
        try {
            for (const {range} of conversionRatioRangeProfiles) {
                const count = conversionRatioCaseCount(range);
                for (let index = 0; index < count; index++) {
                    draw.mockClear().mockReturnValue((index + 0.5) / count);
                    const {data} = generator.generate({range});
                    expect(isMeasurementRatioRelation(data)).toBe(true);
                    const key = [data.units.first.id, data.units.second.id, data.scaleFactor.numerator, data.scaleFactor.denominator].join(':');
                    seen.set(key, (seen.get(key) ?? 0) + 1);
                    const number = (value: {numerator: number; denominator: number}) => value.numerator / value.denominator;
                    for (const direction of ['first-to-second', 'second-to-first'] as const) {
                        const projection = conversionProjection(data, direction);
                        const values = [projection.sourceValue, projection.targetValue, projection.ratioNumerator,
                            projection.ratioDenominator, data.unitEquality.first, data.unitEquality.second].map(number);
                        expect(hasCanonicalRangeWitness([1, ...values], range)).toBe(true);
                        expect(Math.max(...values)).toBeLessThanOrEqual(99999);
                    }
                    expect(draw).toHaveBeenCalledTimes(1);
                    cases++;
                }
            }
            expect(seen).toEqual(expected);
            expect(cases).toBe(34992);
            expect(conversionRatioDomainFootprint.outcomes).toBe(cases);
            expect(conversionRatioDomainFootprint.blocks).toBeLessThan(100);
        } finally { draw.mockRestore(); }
    }, 30000);

    it('requires a supported complete canonical profile before sampling', () => {
        const generator = new MeasurementRatioRelationsGenerator(), draw = vi.spyOn(rng, 'random');
        try {
            for (const config of [null, {}, {range: null}, {range: 10000}, {range: {}},
                {range: {min: 0, max: 10000}}, {range: {...conversionRatioRangeProfiles[0]!.range, min: 5}}]) {
                expect(() => generator.generate(config as never)).toThrow();
            }
            expect(draw).not.toHaveBeenCalled();
        } finally { draw.mockRestore(); }
    });

    it('rejects indices outside the compact finite source slices', () => {
        const range = conversionRatioRangeProfiles[0]!.range;
        for (const index of [-1, 0.5, conversionRatioCaseCount(range)]) {
            expect(() => conversionRatioFrameAt(range, index)).toThrow();
        }
        expect(() => conversionRatioFrameAt({...range, min: 5}, 0)).toThrow();
    });

    it('replays exactly and isolates mutable output from the reused finite domain', () => {
        const generator = new MeasurementRatioRelationsGenerator();
        const config = {range: conversionRatioRangeProfiles[0]!.range};
        rng.setSeed(64);
        const first = generator.generate(config), continuation = rng.random();
        rng.setSeed(64);
        expect(generator.generate(config)).toEqual(first);
        expect(rng.random()).toBe(continuation);
        const original = JSON.stringify(first);
        first.data.units.first.name = 'changed';
        first.data.unitEquality.first.numerator = 999;
        first.data.scaleFactor.numerator = 999;
        rng.setSeed(64);
        expect(JSON.stringify(generator.generate(config))).toBe(original);
    });
});
