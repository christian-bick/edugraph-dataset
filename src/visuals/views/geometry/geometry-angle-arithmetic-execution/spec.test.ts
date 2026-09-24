import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';
describe('geometry-angle-arithmetic-execution view spec', () => {
    it('owns invariant unknown-whole execution', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureExecution]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});
