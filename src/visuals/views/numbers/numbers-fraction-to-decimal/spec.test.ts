import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {NumbersFractionToDecimalViewSchema, spec} from './spec.ts';

describe('numbers-fraction-to-decimal view spec', () => {
    it('owns formalizing a supplied fraction as decimal notation', () => {
        expect(spec.generalLabels).toEqual([
            Area.DecimalEquivalence,
            Area.FractionNotation,
            Scope.FractionNumbers,
            Scope.EqualShares,
            Scope.Equal,
            Scope.SingleFrameOfReference,
            Scope.VisualNumbers,
            Ability.Formalization
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(NumbersFractionToDecimalViewSchema).toEqual({});
    });
});
