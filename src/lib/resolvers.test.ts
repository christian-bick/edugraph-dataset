import { describe, it, expect } from 'vitest';
import {
    hasLabel,
    hasCapability,
    matchAllExactLabels,
    matchAllCapabilities,
    selectExactLabelMap,
    selectExactLabelSetMap,
    selectExactMatch
} from './resolvers.ts';
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

    describe('hasCapability', () => {
        it('returns true if the exact label is present', () => {
            const resolver = hasCapability(Scope.NumbersSmaller10);
            expect(resolver([Scope.NumbersSmaller10])).toBe(true);
        });

        it('returns true if a specialization is present', () => {
            const resolver = hasCapability(Scope.NumericRange);
            expect(resolver([Scope.NumbersSmaller10])).toBe(true);
        });

        it('does not treat partOf children as substitutable capabilities', () => {
            const resolver = hasCapability(Scope.LengthMeasurement);
            expect(resolver([Scope.Tapemeter])).toBe(false);
        });
    });

    describe('matchAllCapabilities', () => {
        it('returns all intersecting labels from the provided target set', () => {
            const targetSet = [Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersLarger10];
            const resolver = matchAllCapabilities(targetSet);
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

    describe('selectExactMatch', () => {
        const supportedShapes = [Area.Square, Area.Rectangle] as const;

        it('returns one exact supported label', () => {
            expect(selectExactMatch([Area.Square], supportedShapes)).toBe(Area.Square);
        });

        it('rejects multiple exact supported labels', () => {
            expect(() => selectExactMatch(
                [Area.Square, Area.Rectangle],
                supportedShapes
            )).toThrow('Ambiguous exact label selection');
        });
    });

    describe('extractConfig Fallback Logic', () => {
        const MockSchema = {
            requireNegative: [
                [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
                hasLabel(Scope.NumbersWithNegatives),
                [[Scope.NumbersWithNegatives], [Scope.NumbersWithoutNegatives]]
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

        it('uses the declared negative-free default when no sign label is requested', () => {
            const { config, resolvedLabels } = extractConfig(MockSchema, []);
            expect(config.requireNegative).toBe(false);
            expect(resolvedLabels).toContain(Scope.NumbersWithoutNegatives);
            expect([Area.Addition, Area.Subtraction]).toContain(config.operation);
        });

        it('uses random descendant fallback if ancestor is provided', () => {
            // ArithmeticOperations is an ancestor of Addition and Subtraction
            const { config } = extractConfig(MockSchema, [Area.ArithmeticOperations]);
            expect([Area.Addition, Area.Subtraction]).toContain(config.operation);
        });
    });
});

describe('exact label mappings', () => {
    const resolveOperation = selectExactLabelMap([
        [Area.Addition, 'addition'],
        [Area.Subtraction, 'subtraction']
    ] as const);

    it('maps exactly one label to its configured value', () => {
        expect(resolveOperation([Area.Addition])).toBe('addition');
    });

    it('rejects multiple mapped labels instead of using declaration order', () => {
        expect(() => resolveOperation([Area.Addition, Area.Subtraction]))
            .toThrow('Ambiguous exact label mapping');
    });

    const resolveDirection = selectExactLabelSetMap([
        [[Scope.SubtractiveCount], Scope.SubtractiveCount],
        [[Area.Decrement, Scope.Before], Scope.SubtractiveCount],
        [[Scope.AdditiveCount], Scope.AdditiveCount],
        [[Area.Increment, Scope.After], Scope.AdditiveCount]
    ] as const);

    it('maps an explicitly allowed correlated label set', () => {
        expect(resolveDirection([Area.Increment, Scope.After])).toBe(Scope.AdditiveCount);
    });

    it('leaves a partial label set unresolved for fallback completion', () => {
        expect(resolveDirection([Area.Increment])).toBeUndefined();
    });

    it('rejects a combination spanning different allowed bundles', () => {
        expect(() => resolveDirection([Area.Increment, Scope.Before]))
            .toThrow('Unsupported exact label combination');
    });
});
