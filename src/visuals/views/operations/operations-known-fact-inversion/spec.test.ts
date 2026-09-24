import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-known-fact-inversion view spec', () => {
    it('owns invariant known-fact procedure inversion', () => {
        expect(spec.generalLabels).toEqual([
            Ability.ProcedureInversion
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});
