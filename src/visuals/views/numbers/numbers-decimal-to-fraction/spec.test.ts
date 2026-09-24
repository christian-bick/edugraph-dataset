import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {NumbersDecimalToFractionViewSchema, spec} from './spec.ts';

describe('numbers-decimal-to-fraction view spec', () => {
    it('owns interpreting a supplied decimal as fraction notation', () => {
        expect(spec.generalLabels).toEqual([
            Area.DecimalEquivalence,
            Area.FractionNotation,
            Scope.FractionNumbers,
            Scope.EqualShares,
            Scope.Equal,
            Scope.SingleFrameOfReference,
            Scope.VisualNumbers,
            Ability.Interpretation
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(NumbersDecimalToFractionViewSchema).toEqual({});
    });
});
