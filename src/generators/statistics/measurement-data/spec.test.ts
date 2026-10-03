import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {matchTarget} from '../../../lib/matching.ts';
import {extractConfig, extractSchemaLabels, generateWithLabels} from '../../../lib/utils.ts';
import {
    MeasurementLinePlotViewSchema, spec as linePlotSpec
} from '../../../visuals/views/data/measurement-line-plot/spec.ts';
import {MeasurementDataGenerator} from './generator.ts';
import {MeasurementDataGeneratorSchema, spec} from './spec.ts';

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

    it.each([
        [Scope.HalfFractions, 'half', 2],
        [Scope.QuarterFractions, 'quarter', 4],
        [Scope.EighthFractions, 'eighth', 8]
    ] as const)('resolves the exact %s denominator on a single frame',
        (fractionLabel, numberKind, subdivisions) => {
            const labels = [fractionLabel, Scope.SingleFrameOfReference];
            const resolution = extractConfig(MeasurementDataGeneratorSchema, labels);
            expect(resolution.config).toMatchObject({numberKind, useSingleFrame: true});
            expect(resolution.resolvedLabels).toContain(fractionLabel);
            expect(resolution.resolvedLabels).toContain(Scope.SingleFrameOfReference);
            const result = generateWithLabels(new MeasurementDataGenerator(), labels)!;
            expect(result.data.subdivisions).toBe(subdivisions);
            expect(result.data.observations.some(({value}) =>
                (value * subdivisions) % 2 === 1)).toBe(true);
            expect(result.labels).toContain(fractionLabel);
        });

    it('matches an exact denominator request without requiring a single-frame label', () => {
        const target = {
            id: 'half-without-explicit-frame',
            labels: [Area.Statistics, Scope.HalfFractions, Scope.LinePlot,
                Scope.ProvidedMeasurement, Ability.VisualArticulation]
        };
        const verdict = matchTarget(target, {
            generatorId: spec.generatorId,
            labels: [...spec.generalLabels, ...extractSchemaLabels(MeasurementDataGeneratorSchema)],
            generalLabels: spec.generalLabels,
            schema: MeasurementDataGeneratorSchema,
            spec,
            problemType: 'MeasurementDataProblem'
        }, {
            viewId: linePlotSpec.viewId,
            supportedLabels: [...linePlotSpec.generalLabels, ...extractSchemaLabels(MeasurementLinePlotViewSchema)],
            generalLabels: linePlotSpec.generalLabels,
            schema: MeasurementLinePlotViewSchema,
            spec: linePlotSpec,
            problemType: 'MeasurementDataProblem'
        });
        expect(verdict).toMatchObject({matched: true});
        if (!verdict.matched) return;
        expect(verdict.plan.domains.find(domain => domain.field === 'numberKind')?.alternatives
            .map(choice => choice.labels)).toEqual([[Scope.HalfFractions]]);
        expect(verdict.plan.domains.find(domain => domain.field === 'useSingleFrame')?.alternatives
            .map(choice => choice.labels)).toContainEqual([]);
    });

    it('rejects competing numeric kinds and unit choices', () => {
        for (const labels of [
            [Scope.IntegerNumbers, Scope.FractionNumbers],
            [Scope.HalfFractions, Scope.QuarterFractions],
            [Scope.FractionNumbers, Scope.EighthFractions],
            [Scope.CentimeterScale, Scope.InchScale]
        ]) expect(() => extractConfig(MeasurementDataGeneratorSchema, labels)).toThrow();
    });
});
