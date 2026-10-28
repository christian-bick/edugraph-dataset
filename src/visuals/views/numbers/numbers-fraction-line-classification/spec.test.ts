import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('numbers-fraction-line-classification view spec', () => {
    it('owns invariant classification on one fraction line', () => {
        expect(spec.generalLabels).toEqual([
        Scope.Numberline,
        Scope.SingleFrameOfReference,
        Ability.ConceptClassification,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumbersWithZero
    ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});
