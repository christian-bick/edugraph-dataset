import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {MeasurementLinePlotViewSchema, spec} from './spec.ts';

describe('measurement-line-plot view spec', () => {
    it('owns provided-data line-plot construction as one invariant task', () => {
        expect(spec.generalLabels).toEqual([
            Scope.LinePlot,
            Scope.LengthMeasurement,
            Scope.ProvidedMeasurement,
            Ability.VisualArticulation
        ]);
        expect(Object.values(MeasurementLinePlotViewSchema).flatMap(([labels]) => labels))
            .toEqual([Scope.StepsOf1]);
    });
});
