import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {OperationsPatternCorrespondenceViewSchema, spec} from './spec.ts';

describe('operations-pattern-correspondence view spec', () => {
    it('declares its fixed learner task and target precondition', () => {
        expect(spec.generalLabels).toEqual([Scope.ArabicNumerals, Ability.ConceptDerivation]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Area.PatternCorrespondence]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(OperationsPatternCorrespondenceViewSchema).toEqual({});
    });
});
