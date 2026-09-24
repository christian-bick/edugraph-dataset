import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-word-problem-reasoning view spec', () => {
    it('owns plausibility evaluation and procedure understanding for rounding targets', () => {
        expect(spec.generalLabels).toEqual([
            Ability.TextualReception,
            Ability.PlausibilityEvaluation,
            Ability.ProcedureUnderstanding
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
    });
});
