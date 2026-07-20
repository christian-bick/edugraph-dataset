import { describe, it, expect } from 'vitest';
import { isSubConceptOf, isCompatibleConcept, resolveRangeFromLabels } from './ontology.ts';
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

    describe('resolveRangeFromLabels', () => {
        it('should resolve default range when no range labels are present', () => {
            const range = resolveRangeFromLabels([]);
            expect(range.min).toBe(0);
            expect(range.max).toBe(Number.MAX_SAFE_INTEGER);
        });

        it('should resolve to the tightest max boundary (SmallerThan) when multiple smallerThan labels exist', () => {
            const range = resolveRangeFromLabels([
                Scope.NumbersSmaller100,
                Scope.NumbersSmaller10,
                Scope.NumbersSmaller20,
            ]);
            expect(range.max).toBe(10);
        });

        it('should resolve to the tightest min boundary (LargerThan) when multiple largerThan labels exist', () => {
            const range = resolveRangeFromLabels([
                Scope.NumbersLarger10,
                Scope.NumbersLarger100,
                Scope.NumbersLarger20,
            ]);
            expect(range.min).toBe(100);
        });

        it('should resolve both boundaries correctly', () => {
            const range = resolveRangeFromLabels([
                Scope.NumbersSmaller100,
                Scope.NumbersLarger20,
            ]);
            expect(range.min).toBe(20);
            expect(range.max).toBe(100);
        });
    });
});
