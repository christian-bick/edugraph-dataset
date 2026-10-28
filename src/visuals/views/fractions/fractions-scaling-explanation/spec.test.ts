import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('fractions-scaling-explanation spec', () => {
    it('claims both invariant Abilities and requires the original explanation target', () => {
        expect(spec.generalLabels).toEqual([Ability.Interpretation, Ability.TextualArticulation, Scope.ArabicNumerals, Scope.Base10, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Ability.TextualArticulation]);
    });
});
