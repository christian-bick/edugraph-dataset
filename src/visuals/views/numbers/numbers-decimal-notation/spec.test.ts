import {Ability, Area, Scope} from 'edugraph-ts';
import {describe, expect, it} from 'vitest';
import {NumbersDecimalNotationViewSchema, spec} from './spec.ts';

describe('numbers-decimal-notation view spec', () => {
    it('owns the shared-whole visual equivalence and conversion direction', () => {
        expect(spec.generalLabels).toEqual([
            Area.DecimalEquivalence,
            Area.FractionNotation,
            Scope.FractionNumbers,
            Scope.EqualShares,
            Scope.Equal,
            Scope.SingleFrameOfReference,
            Scope.VisualNumbers
        ]);
        expect(spec.rejectedLabels).toBeUndefined();
        expect(NumbersDecimalNotationViewSchema.conversionDirection[0]).toEqual([
            Ability.Formalization,
            Ability.Interpretation
        ]);
        const resolve = NumbersDecimalNotationViewSchema.conversionDirection[1];
        expect(resolve([Ability.Formalization])).toBe('fraction-to-decimal');
        expect(resolve([Ability.Interpretation])).toBe('decimal-to-fraction');
        expect(resolve([])).toBeUndefined();
    });
});
