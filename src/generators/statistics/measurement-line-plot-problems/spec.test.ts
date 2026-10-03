import {Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {MeasurementLinePlotProblemsGenerator} from './generator.ts';
import {MeasurementLinePlotProblemsGeneratorSchema, spec} from './spec.ts';

const denominatorCases = [
    [Scope.HalfFractions, 2],
    [Scope.QuarterFractions, 4],
    [Scope.EighthFractions, 8]
] as const;
const operationCases = [
    [Area.Addition, 'addition'],
    [Area.Subtraction, 'subtraction'],
    [Area.Multiplication, 'multiplication'],
    [Area.Division, 'division']
] as const;

describe('measurement-line-plot-problems schema integration', () => {
    it.each(denominatorCases.flatMap(([denominatorLabel, denominator]) =>
        operationCases.map(([operationLabel, operation]) =>
            [denominatorLabel, denominator, operationLabel, operation] as const)))
    ('resolves %s and %s from exact labels', (denominatorLabel, denominator, operationLabel, operation) => {
        const labels = [denominatorLabel, operationLabel];
        const resolution = extractConfig(MeasurementLinePlotProblemsGeneratorSchema, labels);
        expect(resolution.config).toEqual({denominator, operation});
        expect(new Set(resolution.resolvedLabels)).toEqual(new Set(labels));
        const result = generateWithLabels(new MeasurementLinePlotProblemsGenerator(), labels)!;
        expect(result.data.denominator).toBe(denominator);
        expect(result.data.relation.operation).toBe(operation);
        expect(result.labels).toContain(denominatorLabel);
        expect(result.labels).toContain(operationLabel);
    });

    it('declares only invariant statistics and single-frame capabilities', () => {
        expect(spec.generalLabels).toEqual([Area.Statistics, Scope.SingleFrameOfReference]);
    });

    it('rejects competing denominator or operation requests', () => {
        for (const labels of [
            [Scope.HalfFractions, Scope.QuarterFractions, Area.Addition],
            [Scope.QuarterFractions, Scope.EighthFractions, Area.Division],
            [Scope.HalfFractions, Area.Addition, Area.Subtraction],
            [Scope.EighthFractions, Area.Multiplication, Area.Division]
        ]) expect(() => extractConfig(MeasurementLinePlotProblemsGeneratorSchema, labels)).toThrow();
    });
});
