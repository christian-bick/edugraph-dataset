import {Ability, Area, Scope} from 'edugraph-ts';
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
        expect(spec.requiredLabels).toEqual([Area.EmergentFeatureRecognition]);
        expect(spec.requiredTargetAbilities).toEqual([Ability.ProcedureExecution]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
