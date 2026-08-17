import {describe, expect, it} from 'vitest';
import {Area, Scope} from 'edugraph-ts';
import {resolveComparisonRelation} from './helpers.ts';

describe('resolveComparisonRelation', () => {
    it('resolves matching conceptual areas and concrete relation scopes', () => {
        expect(resolveComparisonRelation([Area.NumericEquality, Scope.Equal])).toBe(Scope.Equal);
        expect(resolveComparisonRelation([Area.NumericInequality, Scope.Less])).toBe(Scope.Less);
        expect(resolveComparisonRelation([Area.NumericInequality, Scope.Greater])).toBe(Scope.Greater);
        expect(resolveComparisonRelation([Area.NumericComparison, Scope.Greater])).toBe(Scope.Greater);
    });

    it('derives a canonical relation when only the conceptual area is supplied', () => {
        expect(resolveComparisonRelation([Area.NumericEquality])).toBe(Scope.Equal);
        expect(resolveComparisonRelation([Area.NumericInequality])).toBe(Scope.Less);
        expect(resolveComparisonRelation([])).toBeUndefined();
    });

    it('rejects contradictory areas and scopes', () => {
        expect(() => resolveComparisonRelation([
            Area.NumericEquality,
            Area.NumericInequality
        ])).toThrow();
        expect(() => resolveComparisonRelation([Scope.Less, Scope.Greater])).toThrow();
        expect(() => resolveComparisonRelation([Area.NumericEquality, Scope.Less])).toThrow();
        expect(() => resolveComparisonRelation([Area.NumericInequality, Scope.Equal])).toThrow();
    });
});
