import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('numbers-fraction-line-formalization view spec', () => {
    it('owns invariant fraction formalization on one number line', () => {
        expect(spec.generalLabels).toEqual([
            Scope.Numberline,
            Scope.SingleFrameOfReference,
            Ability.Formalization
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});
