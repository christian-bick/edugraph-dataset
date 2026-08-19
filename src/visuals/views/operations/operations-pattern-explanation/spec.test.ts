import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-pattern-explanation view spec', () => {
    it('owns invariant textual procedure explanation', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ProcedureUnderstanding,
            Ability.TextualArticulation
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
