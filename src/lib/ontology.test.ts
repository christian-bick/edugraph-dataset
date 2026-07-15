import { describe, it, expect } from 'vitest';
import { isSubConceptOf, doesViewSupportProblem, doesGeneratorSupportCompetency } from './ontology.ts';
import { Scope, Area, Ability } from 'edugraph-ts';

describe('Ontology Helper', () => {
    describe('isSubConceptOf', () => {
        it('should return true for identity', () => {
            expect(isSubConceptOf(Scope.NumbersSmaller10, Scope.NumbersSmaller10)).toBe(true);
        });

        it('should return true for transitive child-to-parent relation (20 expands 10)', () => {
            // NumbersSmaller20 expands NumbersSmaller10, so 20 is the sub-concept of 10
            expect(isSubConceptOf(Scope.NumbersSmaller20, Scope.NumbersSmaller10)).toBe(true);
        });

        it('should return false for parent-to-child relation (10 does not expand 20)', () => {
            expect(isSubConceptOf(Scope.NumbersSmaller10, Scope.NumbersSmaller20)).toBe(false);
        });

        it('should return false for unrelated concepts', () => {
            expect(isSubConceptOf(Scope.NumbersSmaller10, Area.Addition)).toBe(false);
        });
    });

    describe('doesViewSupportProblem', () => {
        it('should return true if view supports matching/broader scopes', () => {
            const viewLabels = [Area.Numeration, Scope.NumbersSmaller20, Ability.ProcedureExecution];
            const problemLabels = [Area.Numeration, Scope.NumbersSmaller10, Ability.ProcedureExecution];
            expect(doesViewSupportProblem(viewLabels, problemLabels)).toBe(true);
        });

        it('should return false if view has a narrower scope than the problem', () => {
            const viewLabels = [Area.Numeration, Scope.NumbersSmaller10, Ability.ProcedureExecution];
            const problemLabels = [Area.Numeration, Scope.NumbersSmaller20, Ability.ProcedureExecution];
            expect(doesViewSupportProblem(viewLabels, problemLabels)).toBe(false);
        });

        it('should return true if view declares no supported labels (fallback)', () => {
            expect(doesViewSupportProblem([], [Scope.NumbersSmaller10])).toBe(true);
        });
    });

    describe('doesGeneratorSupportCompetency', () => {
        it('should return true if generator supports required standard concepts', () => {
            const genLabels = [Area.Numeration, Scope.NumbersWithoutZero];
            const compLabels = [Area.Numeration, Scope.NumbersWithoutZero];
            expect(doesGeneratorSupportCompetency(genLabels, compLabels)).toBe(true);
        });
    });
});
