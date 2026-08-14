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
});
