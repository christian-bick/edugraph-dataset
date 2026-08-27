import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementDataGenerator} from './generator.ts';
import {spec} from './spec.ts';

describe('measurement-data spec', () => {
    it('owns the invariant length-measurement context of its canonical observations', () => {
        expect(spec.generalLabels).toEqual([
            Area.Statistics,
            Area.Measurement,
            Scope.LengthMeasurement
        ]);
    });

    it('generates observed whole-unit measurement data without owning the evidence source', () => {
        const result = generateWithLabels(new MeasurementDataGenerator(), [
            Area.Statistics,
            Area.Measurement,
            Scope.LengthMeasurement,
            Scope.ObservedMeasurement,
            Scope.IntegerNumbers,
            Scope.CentimeterScale,
            Ability.ProcedureExecution
        ]);

        expect(result?.data.observations).toHaveLength(6);
        expect(result?.data.unit).toBe('cm');
        expect(result?.labels).not.toContain(Scope.ObservedMeasurement);
    });

    it('resolves provided eighth-inch data without selecting a line-plot task', () => {
        const result = generateWithLabels(new MeasurementDataGenerator(), [
            Area.Statistics,
            Area.Measurement,
            Scope.LengthMeasurement,
            Scope.ProvidedMeasurement,
            Scope.FractionNumbers,
            Scope.InchScale,
            Scope.LinePlot,
            Scope.SingleFrameOfReference,
            Ability.VisualArticulation
        ]);

        expect(result?.data).toEqual(expect.objectContaining({unit: 'in', subdivisions: 8}));
        expect(result?.data.extremaRelation).toBeUndefined();
        expect(result?.labels).toEqual(expect.arrayContaining([
            Scope.SingleFrameOfReference,
            Scope.FractionNumbers,
            Scope.InchScale
        ]));
        expect(result?.labels).not.toContain(Ability.VisualArticulation);
        expect(result?.labels).not.toContain(Scope.LinePlot);
    });

    it.each([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction']
    ] as const)('resolves Grade 4 FractionArithmetic %s as a neutral relation', (operation, taskOperation) => {
        const result = generateWithLabels(new MeasurementDataGenerator(), [
            Area.Statistics,
            Area.Measurement,
            Area.FractionArithmetic,
            operation,
            Scope.LengthMeasurement,
            Scope.FractionNumbers,
            Scope.ProvidedMeasurement,
            Scope.LinePlot,
            Scope.SingleFrameOfReference,
            Ability.ProcedureExecution
        ]);

        expect(result?.data.extremaRelation).toEqual(expect.objectContaining({operation: taskOperation}));
        expect(result?.labels).toEqual(expect.arrayContaining([
            Area.FractionArithmetic,
            operation,
            Scope.SingleFrameOfReference
        ]));
    });
});
