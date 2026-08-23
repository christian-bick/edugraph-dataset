import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {OperationsCountingOnOperationDerivationViewSchema, spec} from './spec.ts';

describe('operations-counting-on-operation-derivation view spec', () => {
    it('derives only the addition operation represented by counting on', () => {
        expect(spec.generalLabels).toEqual([
            Scope.ArabicNumerals,
            Ability.ConceptDerivation
        ]);
        expect(spec.requiredLabels).toEqual([Area.AdditionCountingOn]);
        expect(spec.rejectedLabels).toBeUndefined();
        expect(OperationsCountingOnOperationDerivationViewSchema).toEqual({});
    });
});
