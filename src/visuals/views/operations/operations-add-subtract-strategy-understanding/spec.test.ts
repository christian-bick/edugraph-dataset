import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsAddSubtractStrategyUnderstandingViewSchema, spec} from './spec.ts';

describe('operations-add-subtract-strategy-understanding view spec', () => {
    it('owns visible understanding of a supplied add/subtract strategy', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ProcedureUnderstanding
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(OperationsAddSubtractStrategyUnderstandingViewSchema).toEqual({});
    });
});
