import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {OperationsPatternCorrespondenceExplanationViewSchema, spec} from './spec.ts';

describe('operations-pattern-correspondence-explanation view spec', () => {
    it('declares its fixed learner task and target precondition', () => {
        expect(spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.Interpretation, Ability.TextualArticulation]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.PatternCorrespondence, Ability.TextualArticulation]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(OperationsPatternCorrespondenceExplanationViewSchema).toEqual({});
    });
});
