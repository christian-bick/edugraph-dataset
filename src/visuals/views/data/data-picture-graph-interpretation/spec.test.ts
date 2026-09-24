import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('data-picture-graph-interpretation view spec', () => {
    it('owns invariant category-count interpretation', () => {
        expect(spec.generalLabels).toEqual([Scope.PictureGraph, Ability.Interpretation]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([Scope.SingleStep, Scope.MultiStep].toSorted());
    });
});
