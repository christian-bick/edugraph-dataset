import {describe, expect, it} from 'vitest';
import {MeasurementConversionValuesGenerator} from '../../../generators/measurement/measurement-conversion-values/generator.ts';
import {conversionValueRangeProfiles, conversionValueTuples} from '../../../generators/measurement/measurement-conversion-values/numeric-domain.ts';
import {MeasurementUnitEquivalencesGenerator} from '../../../generators/measurement/measurement-unit-equivalences/generator.ts';
import {MeasurementUnitScaleGenerator} from '../../../generators/measurement/measurement-unit-scale/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {MeasurementConversionPairId, MeasurementConversionValuesProblem} from '../../../types/problems.ts';
import {isValidUnitEquivalenceSequence} from '../../helpers/measurement-conversion.ts';
import {
    formatConversionHundredths,
    formatConversionMeasurement,
    isValidMeasurementConversionValues,
    isValidGenericUnitScaleRelation
} from './measure-conversion-helpers.ts';

const pairIds: MeasurementConversionPairId[] = [
    'kilometer-meter', 'meter-centimeter', 'kilogram-gram', 'pound-ounce',
    'liter-milliliter', 'hour-minute', 'minute-second'
];

describe('measure-conversion validation', () => {
    it.each(pairIds)('validates the distinct sequence and numeric contracts for %s', unitPair => {
        setSeed(unitPair);
        const sequence = new MeasurementUnitEquivalencesGenerator().generate({unitPair}).data;
        expect(isValidUnitEquivalenceSequence(sequence)).toBe(true);
        expect(isValidMeasurementConversionValues(sequence as never)).toBe(false);
        for (const numericProfile of ['integer', 'decimal'] as const) {
            const range = conversionValueRangeProfiles.find(profile => conversionValueTuples(unitPair, numericProfile, profile.range).length)!.range;
            const values = new MeasurementConversionValuesGenerator().generate({unitPair, numericProfile, range}).data;
            expect(isValidMeasurementConversionValues(values)).toBe(true);
            expect(isValidUnitEquivalenceSequence(values as never)).toBe(false);
        }
    });

    it('accepts the complete abstract equal-length partition range', () => {
        const segmentGenerator = new MeasurementUnitScaleGenerator();
        const combinations = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = segmentGenerator.generate({range: createCanonicalNumericRange(seed % 2 ? 20 : 10)}).data;
            combinations.add(`${data.largeUnitCount}:${data.unitsPerLarge}`);
            expect(isValidGenericUnitScaleRelation(data)).toBe(true);
        }
        expect(combinations.size).toBe(8);
    });

    it('rejects inconsistent or out-of-range segment counts', () => {
        const valid = {largeUnitCount: 4, unitsPerLarge: 2, smallUnitCount: 8};
        for (const change of [
            {largeUnitCount: 2}, {largeUnitCount: 7}, {largeUnitCount: 3.5},
            {unitsPerLarge: 1}, {unitsPerLarge: 4}, {unitsPerLarge: 2.5},
            {smallUnitCount: 9}, {smallUnitCount: 8.5}
        ]) expect(isValidGenericUnitScaleRelation({...valid, ...change})).toBe(false);
        expect(isValidGenericUnitScaleRelation(null as never)).toBe(false);
        expect(isValidGenericUnitScaleRelation({...valid, kind: 'generic-unit-count-relation'} as never)).toBe(false);
    });

    it('formats hundredths and unit grammar without floating-point rounding', () => {
        expect(formatConversionHundredths(5)).toBe('0.05');
        expect(formatConversionHundredths(50)).toBe('0.5');
        expect(formatConversionHundredths(100)).toBe('1');
        expect(formatConversionHundredths(125)).toBe('1.25');
        expect(formatConversionHundredths(123000)).toBe('1,230');
        expect(formatConversionMeasurement(100, 'hour')).toBe('1 hour');
        expect(formatConversionMeasurement(125, 'hour')).toBe('1.25 hours');
        for (const invalid of [-1, 1.25, 1_000_001]) {
            expect(() => formatConversionHundredths(invalid)).toThrow(RangeError);
        }
    });

    it('requires two present, distinct, exact equalities with the declared number kind', () => {
        const numeric: MeasurementConversionValuesProblem = {
            pair: {id: 'hour-minute', quantityKind: 'time', scalingKind: 'factor',
                largerUnit: 'hour', smallerUnit: 'minute', factor: 60},
            numericExamples: {numberKind: 'decimal', equalities: [
                {largerHundredths: 125, smallerHundredths: 7500},
                {largerHundredths: 225, smallerHundredths: 13500}
            ]}
        };
        const examples = numeric.numericExamples;
        expect(isValidMeasurementConversionValues(numeric)).toBe(true);
        expect(isValidMeasurementConversionValues(null as never)).toBe(false);
        expect(isValidMeasurementConversionValues({...numeric, pair: {...numeric.pair, factor: 16}})).toBe(false);
        for (const invalid of [
            null, undefined, {...examples, numberKind: 'unknown'}, {...examples, numberKind: 'integer'},
            {...examples, equalities: []}, {...examples, equalities: [examples.equalities[0]]},
            {...examples, equalities: [examples.equalities[0], examples.equalities[0]]},
            {...examples, equalities: [examples.equalities[0], ,]},
            {...examples, equalities: [{...examples.equalities[0], smallerHundredths: 7501}, examples.equalities[1]]},
            {...examples, equalities: [{largerHundredths: 0, smallerHundredths: 0}, examples.equalities[1]]},
            {...examples, equalities: [{largerHundredths: 1.5, smallerHundredths: 90}, examples.equalities[1]]},
            {...examples, equalities: [{largerHundredths: 20001, smallerHundredths: 1200060}, examples.equalities[1]]}
        ]) expect(isValidMeasurementConversionValues({...numeric, numericExamples: invalid as never})).toBe(false);
    });
});
