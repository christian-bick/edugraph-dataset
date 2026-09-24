import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec, MeasureLengthIntegerDrawingViewSchema} from './spec.ts';

describe('measure-length-integer-drawing view spec', () => {
    it('declares drawing as an invariant required task capability', () => {
        expect(spec.generalLabels).toContain(Ability.VisualArticulation);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Ability.VisualArticulation]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toContain(Scope.DecimalNumbers);
        expect(MeasureLengthIntegerDrawingViewSchema).toEqual({});
    });
});
