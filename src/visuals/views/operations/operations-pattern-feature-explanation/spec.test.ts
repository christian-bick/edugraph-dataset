import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-pattern-feature-explanation view spec', () => {
    it('owns invariant generated-feature explanation', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ProcedureExecution,
            Ability.ProcedureUnderstanding,
            Ability.TextualArticulation
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
