import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('fractions-word-problem view spec', () => {
    it('owns its invariant story reception and visual-number representation', () => {
        expect(spec.generalLabels).toEqual([
            Ability.TextualReception,
            Scope.VisualNumbers,
            Ability.ProcedureExecution
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
