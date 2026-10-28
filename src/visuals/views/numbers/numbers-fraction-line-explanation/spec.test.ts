import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('numbers-fraction-line-explanation view spec', () => {
    it('owns invariant formalization with procedural explanation', () => {
        expect(spec.generalLabels).toEqual([
        Scope.Numberline,
        Scope.SingleFrameOfReference,
        Ability.Formalization,
        Ability.ProcedureUnderstanding,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithZero
    ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});
