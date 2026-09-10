import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementDataGenerator} from './generator.ts';
import {MeasurementDataGeneratorSchema} from './spec.ts';

describe('measurement-data schema integration', () => {
    it.each([
        [Scope.IntegerNumbers, 'integer', Scope.CentimeterScale, 'cm', 1],
        [Scope.IntegerNumbers, 'integer', Scope.InchScale, 'in', 1],
        [Scope.FractionNumbers, 'fraction', Scope.CentimeterScale, 'cm', 4],
        [Scope.FractionNumbers, 'fraction', Scope.InchScale, 'in', 4]
    ] as const)('resolves numeric and unit context independently: %s / %s / %s', (numberLabel, numberKind, unitLabel, unit, subdivisions) => {
        const labels = [numberLabel, unitLabel];
        const resolution = extractConfig(MeasurementDataGeneratorSchema, labels);
        expect(resolution.config).toMatchObject({numberKind, unitScale: unit, useSingleFrame: false});
        expect(new Set(resolution.resolvedLabels)).toEqual(new Set(labels));
        const result = generateWithLabels(new MeasurementDataGenerator(), labels)!;
        expect(result.data).toMatchObject({unit, subdivisions});
    });

    it.each([
        [Scope.IntegerNumbers, 'cm', Scope.CentimeterScale],
        [Scope.FractionNumbers, 'in', Scope.InchScale]
    ] as const)('labels its default unit for %s', (numberLabel, unit, unitLabel) => {
        const result = generateWithLabels(new MeasurementDataGenerator(), [numberLabel])!;
        expect(result.data.unit).toBe(unit);
        expect(result.labels).toContain(unitLabel);
    });

    it('preserves the same fractional data across presentation requests', () => {
        const generator = new MeasurementDataGenerator();
        const labels = [Scope.FractionNumbers, Scope.InchScale, Scope.SingleFrameOfReference];
        setSeed('single-frame');
        const reference = generateWithLabels(generator, labels)!;
        expect(reference.data.subdivisions).toBe(8);
        for (const presentation of [
            [Scope.LinePlot, Scope.ProvidedMeasurement, Ability.VisualArticulation],
            [Scope.DataTable, Scope.ObservedMeasurement, Ability.ProcedureExecution]
        ]) {
            setSeed('single-frame');
            const result = generateWithLabels(generator, [...labels, ...presentation])!;
            expect(result).toEqual(reference);
        }
    });

    it('rejects competing numeric kinds and unit choices', () => {
        for (const labels of [
            [Scope.IntegerNumbers, Scope.FractionNumbers],
            [Scope.CentimeterScale, Scope.InchScale]
        ]) expect(() => extractConfig(MeasurementDataGeneratorSchema, labels)).toThrow();
    });
});
