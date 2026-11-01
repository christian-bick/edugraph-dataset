import { describe, expect, it } from 'vitest';
import { Area, Scope } from 'edugraph-ts/generated';
import { expandUpperRangeVariants, type ReviewedUpperRanges } from './target-range-variants.ts';

describe('reviewed target upper ranges', () => {
    it('expands a reviewed cutoff in catalog order and replaces the original upper bound', () => {
        expect(expandUpperRangeVariants([{ labels: [Area.Addition, Scope.NumbersSmaller20] }], { through: 20 }))
            .toEqual([5, 10, 20].map(value => ({ labels: [Area.Addition, Scope[`NumbersSmaller${value}` as keyof typeof Scope]] })));
    });

    it('supports explicit exceptions, deduplicates them and retains other dimensions', () => {
        const labels = [Area.Subtraction, Scope.NumbersWithoutZero, Scope.NumbersWithoutNegatives, Scope.NumbersSmaller100];
        expect(expandUpperRangeVariants([{ labels }], { bands: [100, 10, 100] })).toEqual([
            { labels: [...labels.slice(0, -1), Scope.NumbersSmaller10] },
            { labels: [...labels.slice(0, -1), Scope.NumbersSmaller100] }
        ]);
    });

    it('uses every supported threshold without rounding an unsupported ceiling', () => {
        expect(expandUpperRangeVariants([{ labels: [] }], { through: 1000000 }).map(p => p.labels[0]))
            .toEqual([
                Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20,
                Scope.NumbersSmaller100, Scope.NumbersSmaller120, Scope.NumbersSmaller1000,
                Scope.NumbersSmaller10000, Scope.NumbersSmaller100000, Scope.NumbersSmaller1000000
            ]);
    });

    it('preserves informative lower bounds and omits only the universal zero floor', () => {
        const labels = [Scope.NumbersLargerZero, Scope.NumbersLarger5, Scope.NumbersWithoutZero, Scope.NumbersSmaller100];
        expect(expandUpperRangeVariants([{ labels }], { bands: [10, 20] })).toEqual([
            { labels: [Scope.NumbersLarger5, Scope.NumbersWithoutZero, Scope.NumbersSmaller10] },
            { labels: [Scope.NumbersLarger5, Scope.NumbersWithoutZero, Scope.NumbersSmaller20] }
        ]);
    });

    it('rejects impossible and excluded bounds without silently dropping alternatives', () => {
        expect(() => expandUpperRangeVariants([{ labels: [Scope.NumbersLarger10] }], { bands: [5, 20] }))
            .toThrow(/below the existing lower bound 10/);
        expect(() => expandUpperRangeVariants([{ labels: [Scope.NumbersLarger10] }], { bands: [10, 20] }))
            .toThrow(/excluded by the canonical range policy/);
        expect(() => expandUpperRangeVariants([{ labels: [Scope.NumbersSmaller10] }], { through: 20 }))
            .toThrow(/widen the existing ceiling 10/);
    });

    it('honors the strongest existing conjunction of upper and lower constraints', () => {
        const labels = [Scope.NumbersSmaller100, Scope.NumbersSmaller20, Scope.NumbersLarger5, Scope.NumbersLarger10];
        expect(expandUpperRangeVariants([{ labels }], { bands: [20] })).toEqual([
            { labels: [Scope.NumbersLarger5, Scope.NumbersLarger10, Scope.NumbersSmaller20] }
        ]);
        expect(() => expandUpperRangeVariants([{ labels }], { bands: [100] })).toThrow(/ceiling 20/);
        expect(() => expandUpperRangeVariants([{ labels }], { bands: [5] })).toThrow(/lower bound 10/);
    });

    it.each([
        {}, { bands: [] }, { through: 50 }, { bands: [5, 50] }, { through: 10, bands: [5] }
    ])('rejects an invalid or ambiguous policy: %j', policy => {
        expect(() => expandUpperRangeVariants([{ labels: [] }], policy as ReviewedUpperRanges)).toThrow();
    });

    it('does not create permutations from an empty builder', () => {
        expect(expandUpperRangeVariants([], { through: 20 })).toEqual([]);
    });

    it('deduplicates identical final label sets across existing permutations without mutating inputs', () => {
        const first = Object.freeze({ labels: Object.freeze([Area.Addition, Scope.NumbersSmaller20]) });
        const second = Object.freeze({ labels: Object.freeze([Scope.NumbersSmaller100, Area.Addition, Area.Addition]) });
        // Frozen inputs exercise the runtime purity guarantee in addition to the readonly API.
        const inputs = Object.freeze([first, second]);
        const actual = expandUpperRangeVariants(inputs, { bands: [10, 5] });
        expect(actual).toEqual([
            { labels: [Area.Addition, Scope.NumbersSmaller5] },
            { labels: [Area.Addition, Scope.NumbersSmaller10] }
        ]);
        expect(first.labels).toEqual([Area.Addition, Scope.NumbersSmaller20]);
        expect(second.labels).toEqual([Scope.NumbersSmaller100, Area.Addition, Area.Addition]);
    });
});
