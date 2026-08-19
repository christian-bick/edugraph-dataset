import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-boxes-inversion view spec', () => {
    it('owns invariant equation inversion', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ProcedureExecution,
            Ability.Formalization,
            Ability.ProcedureInversion,
            Area.Equation,
            Scope.ExpressionOnOneSide
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
