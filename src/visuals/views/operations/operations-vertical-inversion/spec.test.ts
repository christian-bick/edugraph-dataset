import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-vertical-inversion view spec', () => {
    it('owns invariant vertical inversion', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ProcedureExecution,
            Ability.ProcedureInversion
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
