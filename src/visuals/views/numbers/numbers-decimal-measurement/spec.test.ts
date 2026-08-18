import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('numbers-decimal-measurement view spec', () => {
    it('owns the one-meter fraction-to-decimal measurement representation', () => {
        expect(spec.generalLabels).toEqual([
            Area.DecimalEquivalence,
            Area.FractionNotation,
            Area.MeasuringWithUnits,
            Scope.FractionNumbers,
            Scope.LengthMeasurement,
            Scope.MeterScale,
            Scope.EqualShares,
            Scope.Equal,
            Scope.SingleFrameOfReference,
            Ability.Formalization
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
