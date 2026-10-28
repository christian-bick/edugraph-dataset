import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('numbers-decimal-measurement view spec', () => {
    it('owns the one-meter fraction-to-decimal measurement representation', () => {
        expect(spec.generalLabels).toEqual([
            Area.DecimalEquivalence,
            Area.FractionNotation,
            Scope.ProperFractions,
            Scope.MeterScale,
            Scope.EqualShares,
            Scope.Equal,
            Scope.SingleFrameOfReference,
            Scope.ArabicNumerals,
            Scope.Base10,
            Scope.NumbersWithZero,
            Ability.Formalization
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});
