import { describe, expect, it } from 'vitest';
import { Scope } from 'edugraph-ts/generated';
import { canonicalRangeLabelChoices, canonicalRangeLabels, canonicalRangeProfiles,
    resolveCanonicalRangeFromLabels, resolveOptionalCanonicalRangeFromLabels } from './canonical-range-labels.ts';
import { createCanonicalNumericRange } from './canonical-numeric-range.ts';
import { normalizeSchemaChoices } from './schema-choices.ts';

describe('canonical range declarations', () => {
    it('provides 45 feasible correlated profiles without the universal zero floor', () => {
        expect(canonicalRangeProfiles).toHaveLength(45);
        expect(canonicalRangeLabelChoices()).toHaveLength(45);
        expect(canonicalRangeLabels).not.toContain(Scope.NumbersLargerZero);
        expect(canonicalRangeLabels).not.toContain(Scope.NumbersLarger1000000);
        for (const profile of canonicalRangeProfiles) {
            expect(resolveCanonicalRangeFromLabels(profile.labels)).toEqual(profile.range);
            expect(profile.range.min).toBeLessThan(profile.range.max);
        }
    });

    it('restricts upper bands, deduplicates order-insensitively and copies its choices', () => {
        const choices = canonicalRangeLabelChoices([20, 5, 20]);
        expect(choices).toEqual([
            [Scope.NumbersSmaller5], [Scope.NumbersSmaller20],
            [Scope.NumbersSmaller20, Scope.NumbersLarger5], [Scope.NumbersSmaller20, Scope.NumbersLarger10]
        ]);
        choices[0]!.push('mutated');
        expect(canonicalRangeLabelChoices([5])).toEqual([[Scope.NumbersSmaller5]]);
    });

    it('resolves a required upper and optional lower, independent of ordering', () => {
        expect(resolveCanonicalRangeFromLabels([Scope.NumbersLarger20, Scope.NumbersSmaller100]))
            .toEqual(createCanonicalNumericRange(100, 20));
    });

    it.each([
        [Scope.NumbersSmaller10, Scope.NumbersLarger10],
        [Scope.NumbersSmaller100, Scope.NumbersSmaller20],
        [Scope.NumbersSmaller100, Scope.NumbersLarger10, Scope.NumbersLarger20]
    ].map(labels => ({labels})))('rejects contradictory or ambiguous bindings $labels', ({labels}) => {
        expect(() => resolveCanonicalRangeFromLabels(labels)).toThrow();
    });

    it('leaves incomplete requests to schema fallback, with an explicit optional empty binding', () => {
        expect(resolveCanonicalRangeFromLabels([])).toBeUndefined();
        expect(resolveCanonicalRangeFromLabels([Scope.NumbersLarger10])).toBeUndefined();
        expect(resolveOptionalCanonicalRangeFromLabels([])).toBe(false);
        expect(resolveOptionalCanonicalRangeFromLabels([Scope.NumbersSmaller5])).toEqual(createCanonicalNumericRange(5));
        expect(resolveOptionalCanonicalRangeFromLabels([Scope.NumbersLarger10])).toBeUndefined();
    });

    it('admits additional strongest lower choices without substituting different requested bounds', () => {
        const schema = {range: [canonicalRangeLabels, resolveCanonicalRangeFromLabels, canonicalRangeLabelChoices()]} as const;
        const choices = normalizeSchemaChoices(schema, [Scope.NumbersSmaller100], 'generator')[0]!.alternatives;
        expect(choices).toHaveLength(4);
        expect(choices.every(choice => choice.labels.includes(Scope.NumbersSmaller100))).toBe(true);
        const explicit = normalizeSchemaChoices(schema, [Scope.NumbersSmaller100, Scope.NumbersLarger10], 'generator')[0]!.alternatives;
        expect(explicit).toHaveLength(1);
        expect(explicit[0]!.labels).toContain(Scope.NumbersLarger10);
    });

    it.each([[], [15], [5, 15]].map(uppers => ({uppers})))('rejects invalid producer upper selections $uppers', ({uppers}) => {
        expect(() => canonicalRangeLabelChoices(uppers)).toThrow(/supported upper/);
    });
});
