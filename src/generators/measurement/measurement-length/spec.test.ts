import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {extractConfig, generateWithLabels} from '../../../lib/utils.ts';
import {resolveSchemaChoices} from '../../../lib/schema-choices.ts';
import {createLabelDependencyEvaluator} from '../../../lib/label-dependencies.ts';
import {matchTarget} from '../../../lib/matching.ts';
import {extractSchemaLabels} from '../../../types/schema.ts';
import {MeasurementLengthGenerator} from './generator.ts';
import {MeasurementLengthGeneratorSchema as schema, spec} from './spec.ts';
import {rulerRangeProfiles} from './numeric-domain.ts';
import {spec as readingView} from '../../../visuals/views/measure/measure-length-integer/spec.ts';
import {spec as drawingView} from '../../../visuals/views/measure/measure-length-integer-drawing/spec.ts';

describe('MeasurementLengthGenerator canonical spec', () => {
    it('resolves all number-kind/range/tool cells directly and through planned choices', () => {
        const evaluator = createLabelDependencyEvaluator();
        expect(spec.generalLabels).toEqual([Area.MeasuringLength, Scope.NumbersWithoutNegatives]);
        expect(rulerRangeProfiles.map(({range}) => [range.min, range.max])).toEqual([[0, 5], [0, 10], [0, 20], [0, 100]]);
        for (const [numberLabel, useDecimals] of [[Scope.IntegerNumbers, false], [Scope.DecimalNumbers, true]] as const) {
            for (const profile of rulerRangeProfiles) for (const tool of [Scope.PhysicalRuler, Scope.Tapemeter]) {
                const labels = [Area.MeasuringLength, numberLabel, ...profile.labels, tool];
                const expected = {useDecimals, range: profile.range, tool};
                expect(extractConfig(schema, labels).config).toEqual(expected);
                expect(resolveSchemaChoices(schema, labels, {useDecimals: [numberLabel], range: profile.labels, tool: [tool]}).config).toEqual(expected);
                const stub = generateWithLabels(new MeasurementLengthGenerator(), labels)!;
                expect(stub.data.useDecimals).toBe(useDecimals);
                for (const view of [readingView, drawingView]) {
                    const result = evaluator.evaluate([...spec.generalLabels!, ...view.generalLabels!, ...labels, Ability.ProcedureExecution]);
                    expect(result.errors).toEqual([]);
                    expect(result.conflicts).toEqual([]);
                    expect(result.assessments.filter(item => item.status === 'missing')).toEqual([]);
                }
            }
        }
    });

    it('omits universal floor and rejects positive lower ranges because ruler origin0 is required', () => {
        expect(schema.range[0]).not.toContain(Scope.NumbersLargerZero);
        const target = {id: 'positive-lower-ruler', labels: [Area.MeasuringLength,
            Scope.IntegerNumbers, Scope.NumbersSmaller10, Scope.NumbersLarger5]};
        expect(matchTarget(target, {generatorId: spec.generatorId, spec, schema,
            generalLabels: spec.generalLabels, labels: [...spec.generalLabels!, ...extractSchemaLabels(schema)],
            problemType: 'MeasurementStandardProblem'}, {viewId: readingView.viewId, spec: readingView, schema: {},
            generalLabels: readingView.generalLabels, supportedLabels: [...readingView.generalLabels!],
            problemType: 'MeasurementStandardProblem'})).toMatchObject({matched: false,
            reason: 'unsupported-label', label: Scope.NumbersLarger5});
    });
});
