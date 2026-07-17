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

    describe('isCompatibleConcept', () => {
        it('should return true if parent extends child in whitelisted range family (Smaller10 is compatible with Smaller20)', () => {
            expect(isCompatibleConcept(Scope.NumbersSmaller10, Scope.NumbersSmaller20)).toBe(true);
        });

        it('should return false if child is broader than parent (Smaller20 is not compatible with Smaller10)', () => {
            expect(isCompatibleConcept(Scope.NumbersSmaller20, Scope.NumbersSmaller10)).toBe(false);
        });

        it('should return true for zero compatibility (WithoutZero is compatible with WithZero)', () => {
            expect(isCompatibleConcept(Scope.NumbersWithoutZero, Scope.NumbersWithZero)).toBe(true);
        });

        it('should return false if zero is required but not supported (WithZero is not compatible with WithoutZero)', () => {
            expect(isCompatibleConcept(Scope.NumbersWithZero, Scope.NumbersWithoutZero)).toBe(false);
        });
    });

    describe('deductCompatible', () => {
        const { deductCompatible } = require('./ontology.ts');
        it('handles standard implication (no contradictions)', () => {
            const result = deductCompatible([Scope.NumbersSmaller100]);
            expect(result).toContain(Scope.NumbersSmaller100);
            expect(result).toContain(Scope.NumbersSmaller20);
            expect(result).toContain(Scope.NumbersSmaller10);
            expect(result).not.toContain(Scope.NumbersSmaller1000);
        });

        it('handles contradictory bounds by pruning both and their implications', () => {
            const result = deductCompatible([Scope.NumbersSmaller10, Scope.NumbersLarger20]);
            expect(result).not.toContain(Scope.NumbersSmaller10);
            expect(result).not.toContain(Scope.NumbersLarger20);
            expect(result).not.toContain(Scope.NumbersLarger100);
        });

        it('resolves exactly to the intersection of compatible constraints', () => {
            const result = deductCompatible([Scope.NumbersSmaller1000, Scope.NumbersLarger10]);
            expect(result).toContain(Scope.NumbersSmaller1000);
            expect(result).toContain(Scope.NumbersLarger10);
            expect(result).not.toContain(Scope.NumbersSmaller10);
            expect(result).not.toContain(Scope.NumbersLarger1000);
            expect(result).toContain(Scope.NumbersSmaller100);
            expect(result).toContain(Scope.NumbersLarger20);
        });
    });
});
