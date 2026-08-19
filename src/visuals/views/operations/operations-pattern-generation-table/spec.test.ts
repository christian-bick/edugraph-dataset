import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-pattern-generation-table view spec', () => {
    it('owns invariant pattern procedure execution', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ProcedureExecution
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
