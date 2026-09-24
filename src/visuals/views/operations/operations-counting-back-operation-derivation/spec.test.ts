import {getTargetPolicyLabels} from '../../../../lib/compatibility.ts';
import {Ability, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsCountingBackOperationDerivationViewSchema, spec} from './spec.ts';

describe('operations-counting-back-operation-derivation view spec', () => {
    it('derives only the subtraction operation represented by counting back', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ConceptDerivation
        ]);
        expect(getTargetPolicyLabels(spec.compatibility, 'require')).toEqual([]);
        expect(getTargetPolicyLabels(spec.compatibility, 'reject')).toEqual([]);
        expect(OperationsCountingBackOperationDerivationViewSchema).toEqual({});
    });
});
