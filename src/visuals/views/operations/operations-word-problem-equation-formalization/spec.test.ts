import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('operations-word-problem-equation-formalization view spec', () => {
    it('owns letter-equation formalization only for equation targets', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.TextualReception,
            Ability.Formalization
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([Ability.Formalization]);
    });
});
