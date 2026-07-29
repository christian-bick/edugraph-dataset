import { describe, it, expect } from 'vitest';
import { hasLabel, hasSubConcept, matchAllExactLabels, matchAllLabels } from './resolvers.ts';
import { extractConfig } from './utils.ts';
import { Scope, Area } from 'edugraph-ts';

describe('Resolvers & Utilities', () => {
    describe('hasLabel', () => {
        it('returns true if the exact label is present', () => {
            const resolver = hasLabel(Scope.NumbersWithZero);
            expect(resolver([Scope.NumbersWithZero, Scope.NumbersSmaller10])).toBe(true);
        });

        it('returns false if the exact label is missing (even if an ancestor is present)', () => {
            const resolver = hasLabel(Scope.NumbersWithZero);
            expect(resolver([Scope.NumericZero])).toBe(false);
        });
    });

    describe('hasSubConcept', () => {
        it('returns true if the exact label is present', () => {
            const resolver = hasSubConcept(Scope.NumbersSmaller10);
            expect(resolver([Scope.NumbersSmaller10])).toBe(true);
        });

        it('returns true if a descendant label is present', () => {
            const resolver = hasSubConcept(Scope.NumericRange);
            expect(resolver([Scope.NumbersSmaller10])).toBe(true);
        });
    });

    describe('matchAllLabels', () => {
        it('returns all intersecting labels from the provided target set', () => {
            const targetSet = [Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersLarger10];
            const resolver = matchAllLabels(targetSet);
            const result = resolver([Scope.NumbersSmaller10, Scope.NumbersLarger100]); // Larger100 is not in targetSet
            expect(result).toContain(Scope.NumbersSmaller10);
            expect(result).not.toContain(Scope.NumbersSmaller20);
            expect(result).not.toContain(Scope.NumbersLarger10);
            expect(result).not.toContain(Scope.NumbersLarger100);
        });
    });

    describe('matchAllExactLabels', () => {
        const supportedShapes = [Area.Square, Area.Rectangle] as const;

        it('does not admit a supported ancestor that is absent from the labels', () => {
            expect(matchAllExactLabels([Area.Square], supportedShapes)).toEqual([Area.Square]);
        });

        it('returns every explicitly present supported label', () => {
            expect(matchAllExactLabels([Area.Square, Area.Rectangle], supportedShapes)).toEqual(supportedShapes);
        });
    });

    describe('extractConfig Fallback Logic', () => {
        const MockSchema = {
            requireNegative: [
                [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
                hasLabel(Scope.NumbersWithNegatives)
            ],
            operation: [
                Area.Addition,
                Area.Subtraction
            ]
        } as const;

        it('uses specific matches if provided', () => {
            const { config } = extractConfig(MockSchema, [Scope.NumbersWithNegatives, Area.Subtraction]);
            expect(config.requireNegative).toBe(true);
            expect(config.operation).toBe(Area.Subtraction);
        });

        it('uses random fallback if no matches provided', () => {
            const { config } = extractConfig(MockSchema, []);
            expect(config.requireNegative).toBeTypeOf('boolean');
            expect([Area.Addition, Area.Subtraction]).toContain(config.operation);
        });

        it('uses random descendant fallback if ancestor is provided', () => {
            // ArithmeticOperations is an ancestor of Addition and Subtraction
            const { config } = extractConfig(MockSchema, [Area.ArithmeticOperations]);
            expect([Area.Addition, Area.Subtraction]).toContain(config.operation);
        });
    });
});
