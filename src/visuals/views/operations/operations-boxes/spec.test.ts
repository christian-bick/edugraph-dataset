import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {spec} from './spec.ts';

describe('operations-boxes view spec', () => {
    it('owns invariant direct equation execution', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ProcedureExecution,
            Ability.Formalization,
            Area.Equation,
            Scope.ExpressionOnOneSide
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});
