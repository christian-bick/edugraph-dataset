import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {MeasurementLinePlotViewSchema, spec} from './spec.ts';

describe('measurement-line-plot view spec', () => {
    it('owns provided-data line-plot construction as one invariant task', () => {
        expect(spec.generalLabels).toEqual([
            Area.FrequencyDistribution,
            Scope.LinePlot,
            Scope.ProvidedMeasurement,
            Ability.VisualArticulation
        ]);
        expect(Object.values(MeasurementLinePlotViewSchema).flatMap(([labels]) => labels))
            .toEqual([Scope.StepsOf1]);
    });
});
