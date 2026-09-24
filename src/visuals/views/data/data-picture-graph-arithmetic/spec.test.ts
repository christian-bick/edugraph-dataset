import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('data-picture-graph-arithmetic view spec', () => {
    it('owns invariant total calculation within its layout capacity', () => {
        expect(spec.generalLabels).toEqual([Scope.PictureGraph, Ability.ProcedureExecution]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([Scope.SingleStep, Scope.MultiStep].toSorted());
    });
});
