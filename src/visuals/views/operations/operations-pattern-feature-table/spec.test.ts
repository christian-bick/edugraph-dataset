import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-pattern-feature-table view spec', () => {
    it('owns invariant generated-feature classification', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ConceptClassification,
            Ability.ProcedureExecution
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
