import { describe, it, expect } from 'vitest';
import { isSubConceptOf, isCompatibleConcept } from './ontology.ts';
import { Scope, Area, Ability } from 'edugraph-ts';

describe('Ontology Helper', () => {
    describe('isSubConceptOf', () => {
        it('should return true for identity', () => {
            expect(isSubConceptOf(Scope.NumbersSmaller10, Scope.NumbersSmaller10)).toBe(true);
        });

        it('should return true for taxonomic child-to-parent relation (10 is partOf NumericRange)', () => {
            expect(isSubConceptOf(Scope.NumbersSmaller10, Scope.NumericRange)).toBe(true);
        });

        it('should return false for parent-to-child relation (NumericRange is not partOf 10)', () => {
            expect(isSubConceptOf(Scope.NumericRange, Scope.NumbersSmaller10)).toBe(false);
        });

        it('should return false for unrelated concepts', () => {
            expect(isSubConceptOf(Scope.NumbersSmaller10, Area.Addition)).toBe(false);
        });
    });


});
