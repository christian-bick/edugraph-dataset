import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {Scope} from 'edugraph-ts';
import {spec} from './spec.ts';

describe('operations-vertical view spec', () => {
    it('owns invariant direct vertical execution', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ProcedureExecution
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
