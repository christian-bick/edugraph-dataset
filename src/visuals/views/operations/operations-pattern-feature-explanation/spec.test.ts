import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-pattern-feature-explanation view spec', () => {
    it('owns invariant generated-feature explanation', () => {
        expect(spec.generalLabels).toEqual([
            Area.EmergentFeatureRecognition,
            Area.PatternGeneration,
            Scope.ArabicNumerals,
            Ability.ProcedureExecution,
            Ability.ProcedureUnderstanding,
            Ability.TextualArticulation
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([
            Area.EmergentFeatureRecognition,
            Ability.ProcedureExecution
        ].toSorted());
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});
