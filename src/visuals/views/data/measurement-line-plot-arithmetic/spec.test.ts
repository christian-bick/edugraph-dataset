import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('measurement-line-plot-arithmetic view spec', () => {
    it('owns invariant arithmetic from provided line-plot data', () => {
        expect(spec.generalLabels).toEqual([
            Scope.LinePlot,
            Scope.LengthMeasurement,
            Scope.ProvidedMeasurement,
            Ability.ProcedureExecution
        ]);
        expect(spec.requiredLabels).toEqual([Area.FractionArithmetic]);
    });
});
