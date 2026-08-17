import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementDataGenerator} from './generator.ts';

describe('measurement-data spec', () => {
    it('generates measurement observations for the Grade 2 data labels', () => {
        const result = generateWithLabels(new MeasurementDataGenerator(), [
            Area.Statistics,
            Area.MeasuringObjects,
            Scope.LengthMeasurement,
            Scope.IntegerNumbers,
            Ability.ProcedureExecution
        ]);

        expect(result?.data.observations).toHaveLength(6);
        expect(result?.data.unit).toBe('cm');
    });

    it('resolves fractional labels to quarter-inch observations', () => {
        const result = generateWithLabels(new MeasurementDataGenerator(), [
            Area.Statistics,
            Area.MeasuringObjects,
            Scope.LengthMeasurement,
            Scope.FractionNumbers,
            Ability.ProcedureExecution
        ]);

        expect(result?.data.unit).toBe('in');
        expect(result?.data.subdivisions).toBe(4);
        expect(result?.data.observations.every(({length}) => Number.isInteger(length * 4))).toBe(true);
    });

    it('resolves Grade 4 construction from the single-frame label without arithmetic', () => {
        const result = generateWithLabels(new MeasurementDataGenerator(), [
            Area.Statistics,
            Area.MeasuringObjects,
            Scope.LengthMeasurement,
            Scope.FractionNumbers,
            Scope.LinePlot,
            Scope.SingleFrameOfReference,
            Ability.VisualArticulation
        ]);

        expect(result).not.toBeNull();
        if (!result || !('task' in result.data)) throw new Error('Expected Grade 4 construction data.');
        expect(result.data.task).toBe('construct-fraction-line-plot');
        expect(result?.tags).toEqual(expect.arrayContaining([
            Scope.SingleFrameOfReference,
            Scope.FractionNumbers
        ]));
        expect(result?.tags).not.toContain(Ability.ProcedureExecution);
    });

    it.each([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction']
    ] as const)('resolves Grade 4 FractionArithmetic %s', (operation, taskOperation) => {
        const result = generateWithLabels(new MeasurementDataGenerator(), [
            Area.Statistics,
            Area.MeasuringObjects,
            Area.FractionArithmetic,
            operation,
            Scope.LengthMeasurement,
            Scope.FractionNumbers,
            Scope.LinePlot,
            Scope.SingleFrameOfReference,
            Ability.ProcedureExecution
        ]);

        expect(result?.data).toMatchObject({
            task: 'fraction-line-plot-arithmetic',
            operation: taskOperation
        });
        expect(result?.tags).toEqual(expect.arrayContaining([
            Area.FractionArithmetic,
            operation,
            Scope.SingleFrameOfReference
        ]));
    });
});
