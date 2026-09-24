import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('numbers-factors-multiples view spec', () => {
    it('owns execution only for factor-and-multiple targets', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureExecution]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
    });
});
