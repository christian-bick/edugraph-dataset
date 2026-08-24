import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec, MeasureLengthDecimalDrawingViewSchema} from './spec.ts';

describe('measure-length-decimal-drawing view spec', () => {
    it('declares drawing as an invariant required task capability', () => {
        expect(spec.generalLabels).toContain(Ability.VisualArticulation);
        expect(spec.requiredLabels).toEqual([Ability.VisualArticulation]);
        expect(spec.rejectedLabels).toContain(Scope.IntegerNumbers);
        expect(MeasureLengthDecimalDrawingViewSchema).toEqual({});
    });
});
