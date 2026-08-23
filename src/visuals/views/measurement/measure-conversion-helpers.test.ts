import {describe, expect, it} from 'vitest';
import {MeasurementConversionGenerator} from '../../../generators/measurement/measurement-conversion/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import {
    MeasurementConversionPairId,
    MeasurementConversionProblem
} from '../../../types/problems.ts';
import {
    isSupportedMeasureConversionProblem,
    isValidMeasureConversionProblem
} from './measure-conversion-helpers.ts';

const pairIds: MeasurementConversionPairId[] = [
    'kilometer-meter',
    'meter-centimeter',
    'kilogram-gram',
    'pound-ounce',
    'liter-milliliter',
    'hour-minute',
    'minute-second'
];

describe('measure-conversion validation', () => {
    const generator = new MeasurementConversionGenerator();

    it('accepts every canonical conversion task', () => {
        for (const unitPair of pairIds) {
            for (const task of [
                'relative-unit-size',
                'convert-larger-to-smaller'
            ] as const) {
                setSeed(`${unitPair}-${task}`);
                const problem = generator.generate({task, unitPair}).data;
                expect(isSupportedMeasureConversionProblem(problem)).toBe(true);
                if (isSupportedMeasureConversionProblem(problem)) {
                    expect(isValidMeasureConversionProblem(problem)).toBe(true);
                }
            }
        }
    });

    it('accepts the complete abstract equal-length partition range', () => {
        const combinations = new Set<string>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(`generic-${seed}`);
            const problem = generator.generate({
                task: 'relative-unit-size',
                unitPair: 'generic-unit-scale'
            }).data;
            expect(isSupportedMeasureConversionProblem(problem)).toBe(true);
            if (problem.task === 'generic-unit-scale') {
                combinations.add(`${problem.largeUnitCount}:${problem.unitsPerLarge}`);
                expect(isValidMeasureConversionProblem(problem)).toBe(true);
            }
        }
        expect(combinations.size).toBe(8);
    });

    it('rejects inconsistent canonical values and unsupported table payloads', () => {
        setSeed('invalid-relative');
        const relative = generator.generate({
            task: 'relative-unit-size',
            unitPair: 'hour-minute'
        }).data;
        expect(relative.task).toBe('relative-unit-size');
        if (relative.task !== 'relative-unit-size') return;
        expect(isValidMeasureConversionProblem({
            ...relative,
            exampleSmallerValue: relative.exampleSmallerValue + 1
        })).toBe(false);
        expect(isValidMeasureConversionProblem({
            ...relative,
            pair: {...relative.pair, factor: 16}
        })).toBe(false);

        const table = generator.generate({
            task: 'conversion-table',
            unitPair: 'hour-minute'
        }).data as MeasurementConversionProblem;
        expect(isSupportedMeasureConversionProblem(table)).toBe(false);
    });
});
