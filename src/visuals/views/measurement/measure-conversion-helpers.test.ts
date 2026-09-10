import {describe, expect, it} from 'vitest';
import {MeasurementConversionGenerator} from '../../../generators/measurement/measurement-conversion/generator.ts';
import {MeasurementUnitScaleGenerator} from '../../../generators/measurement/measurement-unit-scale/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {MeasurementConversionPairId} from '../../../types/problems.ts';
import {isValidMeasureConversionProblem} from './measure-conversion-helpers.ts';

const pairIds: MeasurementConversionPairId[] = [
    'kilometer-meter', 'meter-centimeter', 'kilogram-gram', 'pound-ounce',
    'liter-milliliter', 'hour-minute', 'minute-second'
];

describe('measure-conversion validation', () => {
    const generator = new MeasurementConversionGenerator();

    it.each(pairIds)('accepts canonical equivalences for %s', unitPair => {
        setSeed(unitPair);
        expect(isValidMeasureConversionProblem(generator.generate({unitPair}).data)).toBe(true);
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
});
