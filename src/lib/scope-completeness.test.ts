import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import type {MatchTuple} from './matching.ts';
import {buildScopeCompletenessInventory} from './scope-completeness.ts';

const target = {
    id: 'length-target',
    title: 'Length',
    description: 'Measure a length',
    labels: [Scope.LengthMeasurement]
};

const tuples: MatchTuple[] = [{
    target,
    generatorId: 'measurement',
    viewId: 'measure-view'
}];

const resolver = (labels: string[]) => labels.includes(Scope.LengthMeasurement)
    || labels.includes(Scope.MeterScale)
    ? 'length'
    : undefined;

const inventory = (schema: any) => buildScopeCompletenessInventory({
    tuples,
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
});
