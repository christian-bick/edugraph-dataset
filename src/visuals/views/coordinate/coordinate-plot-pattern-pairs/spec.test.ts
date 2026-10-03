import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {CoordinatePlotPatternPairsViewSchema, spec} from './spec.ts';

describe('coordinate-plot-pattern-pairs view spec', () => {
    it('owns its fixed task identity and limits participation to that Area', () => {
        expect(spec.generalLabels).toEqual([Area.PointPlotting, Scope.CartesianCoordinateSystem, Ability.VisualArticulation]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.PointPlotting]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(CoordinatePlotPatternPairsViewSchema).toEqual({});
    });
});
