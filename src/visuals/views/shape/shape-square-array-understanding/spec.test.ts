import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('shape-square-array-understanding view spec', () => {
    it('owns box-arrangement area-product understanding', () => {
        expect(spec.generalLabels).toEqual([Ability.ProcedureUnderstanding]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Scope.BoxArrangement]);
    });
});
