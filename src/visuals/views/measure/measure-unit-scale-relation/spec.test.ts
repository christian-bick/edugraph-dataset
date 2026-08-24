import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('measure-unit-scale-relation view spec', () => {
    it('accepts generic length partitions but rejects concrete unit measurement', () => {
        expect(spec.generalLabels).toEqual([Ability.ConceptDerivation]);
        expect(spec.requiredLabels).toEqual([
            Area.UnitScaleRelation,
            Scope.LengthMeasurement
        ]);
        expect(spec.rejectedLabels).toEqual([Area.MeasuringWithUnits]);
    });
});
