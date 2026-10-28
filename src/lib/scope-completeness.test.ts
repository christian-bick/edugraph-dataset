import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {matchTargets} from './matching.ts';
import {buildScopeCompletenessInventory} from './scope-completeness.ts';
import {withLabelChoices} from '../types/schema.ts';

const target = {
    id: 'length-target',
    title: 'Length',
    description: 'Measure a length',
    labels: [Scope.LengthMeasurement]
};

const resolver = withLabelChoices((labels: string[]) => labels.includes(Scope.LengthMeasurement)
    || labels.includes(Scope.MeterScale)
    ? 'length'
    : undefined, {
        kind: 'alternatives',
        alternatives: [[Scope.LengthMeasurement], [Scope.MeterScale], [Scope.LengthMeasurement, Scope.MeterScale]],
        equivalenceGroups: [[[Scope.LengthMeasurement], [Scope.MeterScale], [Scope.LengthMeasurement, Scope.MeterScale]]]
    });

const inventory = (schema: any) => buildScopeCompletenessInventory({
    tuples: matchTargets([target], [{generatorId: 'measurement', generalLabels: [],
        labels: [Scope.LengthMeasurement, Scope.MeterScale], schema, problemType: 'ArithmeticPairProblem'}],
    [{viewId: 'measure-view', generalLabels: [], supportedLabels: [], schema: {}, problemType: 'ArithmeticPairProblem'}]).tuples,
    generators: [{generatorId: 'measurement', generalLabels: [], schema}],
    views: [{viewId: 'measure-view', generalLabels: [], schema: {}}]
});

describe('buildScopeCompletenessInventory', () => {
    it('reports a co-resolving Scope which is absent from pair-derived labels', () => {
        const report = inventory({
            measurement: [[Scope.LengthMeasurement, Scope.MeterScale], resolver]
        });

        expect(report.missing_candidates).toEqual([expect.objectContaining({
            role: 'generator',
            module_id: 'measurement',
            parameter: 'measurement',
            resolved_value: 'length',
            co_resolving_labels: [Scope.LengthMeasurement, Scope.MeterScale],
            missing_scope_labels: [Scope.MeterScale],
            affected_tuples: [{
                target_id: 'length-target',
                generator_id: 'measurement',
                view_id: 'measure-view'
            }]
        })]);
    });

    it('records a completed conjunction as an additional observable Scope', () => {
        const report = inventory({
            measurement: [
                [Scope.LengthMeasurement, Scope.MeterScale],
                resolver,
                [[Scope.LengthMeasurement, Scope.MeterScale]]
            ]
        });

        expect(report.missing_candidates).toEqual([]);
        expect(report.additional_scopes).toContainEqual({
            label: Scope.MeterScale,
            tuple_count: 1
        });
    });

    it('includes actual owner inference in the realized inventory without making outputs matching capabilities', () => {
        const generator = {generatorId: 'inferred-generator', generalLabels: [Area.Addition, Scope.IntegerNumbers,
            Scope.NumbersWithoutNegatives], labels: [Area.Addition, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives],
            schema: {}, problemType: 'ArithmeticPairProblem', spec: {
                generatorId: 'inferred-generator',
                generalLabels: [Area.Addition, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives],
                inferredLabels: [{produces: [Scope.NumbersWithoutZero], infer: () => [Scope.NumbersWithoutZero]}]
            }};
        const view = {viewId: 'inferred-view', generalLabels: [], supportedLabels: [], schema: {},
            problemType: 'ArithmeticPairProblem', spec: {viewId: 'inferred-view', generalLabels: [],
                inferredLabels: [{produces: [Scope.ArabicNumerals], infer: () => [Scope.ArabicNumerals]}]}};
        const targets = [{id: 'inference-inventory', labels: [Area.Addition]}];
        const tuples = matchTargets(targets, [generator], [view]).tuples;
        expect(tuples).toHaveLength(1);
        expect(matchTargets([{id: 'not-supported', labels: [Area.Addition, Scope.NumbersWithoutZero]}],
            [generator], [view]).tuples).toHaveLength(0);
        const report = buildScopeCompletenessInventory({tuples, generators: [generator], views: [view]});
        expect(report.additional_scopes).toEqual(expect.arrayContaining([
            {label: Scope.NumbersWithoutZero, tuple_count: 1}, {label: Scope.ArabicNumerals, tuple_count: 1}
        ]));
        expect(generator.labels).not.toContain(Scope.NumbersWithoutZero);
        expect(view.supportedLabels).toEqual([]);
    });
});
