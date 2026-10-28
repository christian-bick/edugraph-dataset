import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {spec} from './spec.ts';

describe('fractions-understanding-model view spec', () => {
    it('owns its invariant procedural relations and equation formalization', () => {
        expect(spec.generalLabels).toEqual([
        Scope.VisualNumbers,
        Ability.ProcedureUnderstanding,
        Ability.Formalization,
        Scope.ArabicNumerals,
        Scope.Base10
    ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
    });
});
