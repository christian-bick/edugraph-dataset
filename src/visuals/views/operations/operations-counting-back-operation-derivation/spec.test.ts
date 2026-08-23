import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsCountingBackOperationDerivationViewSchema, spec} from './spec.ts';

describe('operations-counting-back-operation-derivation view spec', () => {
    it('derives only the subtraction operation represented by counting back', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ConceptDerivation
        ]);
        expect(spec.requiredLabels).toEqual([Area.SubtractionCountingBack]);
        expect(spec.rejectedLabels).toBeUndefined();
        expect(OperationsCountingBackOperationDerivationViewSchema).toEqual({});
    });
});
