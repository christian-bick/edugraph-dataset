import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-pattern-explanation view spec', () => {
    it('owns invariant textual procedure explanation', () => {
        expect(spec.generalLabels).toEqual([
            Area.EmergentFeatureRecognition,
            Scope.ArabicNumerals,
            Ability.ProcedureUnderstanding,
            Ability.TextualArticulation
        ]);
        expect(spec.requiredLabels).toEqual([Area.EmergentFeatureRecognition]);
        expect(spec.rejectedLabels).toBeUndefined();
    });
});
