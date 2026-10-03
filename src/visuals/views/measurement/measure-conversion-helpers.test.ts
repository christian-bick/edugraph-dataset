import {describe, expect, it} from 'vitest';
import {MeasurementConversionGenerator} from '../../../generators/measurement/measurement-conversion/generator.ts';
import {MeasurementUnitScaleGenerator} from '../../../generators/measurement/measurement-unit-scale/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementConversionPairId, StandardUnitEquivalencesProblem} from '../../../types/problems.ts';
import {
    formatConversionHundredths,
    formatConversionMeasurement,
    isValidConversionNumericExamples,
    isValidMeasureConversionProblem
} from './measure-conversion-helpers.ts';

const pairIds: MeasurementConversionPairId[] = [
    'kilometer-meter', 'meter-centimeter', 'kilogram-gram', 'pound-ounce',
    'liter-milliliter', 'hour-minute', 'minute-second'
];

describe('measure-conversion validation', () => {
    const generator = new MeasurementConversionGenerator();

    it.each(pairIds)('accepts canonical equivalences for %s', unitPair => {
        setSeed(unitPair);
        expect(isValidMeasureConversionProblem(generator.generate({unitPair, numericProfile: 'legacy'}).data)).toBe(true);
    });

    it('accepts the complete abstract equal-length partition range', () => {
        const segmentGenerator = new MeasurementUnitScaleGenerator();
        const combinations = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = segmentGenerator.generate({}).data;
            combinations.add(`${data.largeUnitCount}:${data.unitsPerLarge}`);
            expect(isValidMeasureConversionProblem(data)).toBe(true);
        }
        expect(combinations.size).toBe(8);
    });

    it('rejects inconsistent or out-of-range segment counts', () => {
        const valid = {largeUnitCount: 4, unitsPerLarge: 2, smallUnitCount: 8};
        for (const change of [
            {largeUnitCount: 2}, {largeUnitCount: 7}, {largeUnitCount: 3.5},
            {unitsPerLarge: 1}, {unitsPerLarge: 4}, {unitsPerLarge: 2.5},
            {smallUnitCount: 9}, {smallUnitCount: 8.5}
        ]) expect(isValidMeasureConversionProblem({...valid, ...change})).toBe(false);
        expect(isValidMeasureConversionProblem(null as never)).toBe(false);
    });

    it('formats hundredths and unit grammar without floating-point rounding', () => {
        expect(formatConversionHundredths(5)).toBe('0.05');
        expect(formatConversionHundredths(50)).toBe('0.5');
        expect(formatConversionHundredths(100)).toBe('1');
        expect(formatConversionHundredths(125)).toBe('1.25');
        expect(formatConversionHundredths(123000)).toBe('1,230');
        expect(formatConversionMeasurement(100, 'hour')).toBe('1 hour');
        expect(formatConversionMeasurement(125, 'hour')).toBe('1.25 hours');
        expect(() => formatConversionHundredths(1.25)).toThrow(RangeError);
        expect(() => formatConversionHundredths(1_000_001)).toThrow(RangeError);
    });

    it('validates two distinct exact numeric equalities and the number kind', () => {
        setSeed('numeric-conversion');
        const legacy = generator.generate({unitPair: 'hour-minute', numericProfile: 'legacy'}).data;
        const numeric: StandardUnitEquivalencesProblem = {
            ...legacy,
            numericExamples: {
                numberKind: 'decimal',
                equalities: [
                    {largerHundredths: 125, smallerHundredths: 7500},
                    {largerHundredths: 225, smallerHundredths: 13500}
                ]
            }
        };
        expect(isValidConversionNumericExamples(numeric)).toBe(true);
        expect(isValidMeasureConversionProblem(numeric)).toBe(true);
        expect(isValidConversionNumericExamples({
            ...numeric,
            numericExamples: {...numeric.numericExamples!, equalities: [
                numeric.numericExamples!.equalities[0],
                numeric.numericExamples!.equalities[0]
            ]}
        })).toBe(false);
        expect(isValidConversionNumericExamples({
            ...numeric,
            numericExamples: {...numeric.numericExamples!, equalities: [
                {...numeric.numericExamples!.equalities[0], smallerHundredths: 7501},
                numeric.numericExamples!.equalities[1]
            ]}
        })).toBe(false);
        expect(isValidConversionNumericExamples({
            ...numeric,
            numericExamples: {...numeric.numericExamples!, numberKind: 'integer'}
        })).toBe(false);
        expect(isValidMeasureConversionProblem({...numeric, numericExamples: null as never})).toBe(false);
    });
});
