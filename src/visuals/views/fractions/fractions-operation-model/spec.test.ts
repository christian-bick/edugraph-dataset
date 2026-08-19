import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('fractions-operation-model view spec', () => {
    it('owns its invariant procedure-execution model', () => {
        expect(spec.generalLabels).toEqual([
            Scope.VisualNumbers,
            Ability.ProcedureExecution
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
