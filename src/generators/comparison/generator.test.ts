import {describe, expect, it, vi} from 'vitest';
import * as random from '../../lib/random.ts';
import {createCanonicalNumericRange, hasCanonicalRangeWitness, CANONICAL_RANGE_THRESHOLDS}
    from '../../lib/canonical-numeric-range.ts';
import {ComparisonGenerator} from './generator.ts';
import {comparisonProfiles, comparisonMaximumValue} from './profiles.ts';
import {comparisonIntervals, type ComparisonProfile} from './sampling.ts';
import {isValidMultiDigitComparisonProblem} from '../../visuals/views/numbers/numbers-compare/helpers.ts';

const profile = (upper: number, lower = 0, changes: Partial<ComparisonProfile> = {}): ComparisonProfile => {
    const range = createCanonicalNumericRange(upper, lower);
    return {range, maximumValue: comparisonMaximumValue(range), relation: 'less',
        requireNegative: false, requireZero: false, ...changes};
};

describe('ComparisonGenerator', () => {
    const generator = new ComparisonGenerator();

    it('validates the required canonical profile without loose-range fallbacks', () => {
        expect(generator.type).toBe('comparison');
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({comparison: {} as ComparisonProfile})).toThrow();
        expect(() => generator.generate({comparison: {...profile(10), range: undefined!}})).toThrow();
    });

    it('proves every declared range, relation, zero and sign combination', () => {
        for (const {profile: comparison} of comparisonProfiles) {
            for (let seed = 0; seed < 24; seed++) {
                random.setSeed(seed);
                const result = generator.generate({comparison});
                expect(result, JSON.stringify(comparison)).not.toBeNull();
                const {num1, num2, relation} = result!.data;
                const values = [num1, num2];
                expect(hasCanonicalRangeWitness(values, comparison.range)).toBe(true);
                expect(values.every(value => Math.abs(value) <= comparison.maximumValue)).toBe(true);
                expect(values.includes(0)).toBe(comparison.requireZero);
                expect(values.some(value => value < 0)).toBe(comparison.requireNegative);
                expect(relation).toBe(num1 < num2 ? 'less' : num1 > num2 ? 'greater' : 'equal');
                expect(relation).toBe(comparison.relation);
                expect(Math.abs(num1) === Math.abs(num2)
                    && CANONICAL_RANGE_THRESHOLDS.includes(Math.abs(num1) as never)).toBe(false);
                if ('task' in result!.data) {
                    expect(isValidMultiDigitComparisonProblem(result!.data)).toBe(true);
                }
            }
        }
    });

    it('defensively rejects impossible canonical and sign/zero combinations', () => {
        for (const comparison of [
            profile(10, 0, {relation: 'equal'}),
            profile(100, 10, {relation: 'equal'}),
            profile(5, 0, {relation: 'equal', requireZero: true, requireNegative: true}),
            profile(20, 10, {requireZero: true}),
            profile(100, 10, {maximumValue: 20}),
            profile(10, 5, {range: {...createCanonicalNumericRange(10, 5), min: 10}}),
            profile(10, 5, {relation: 'unsupported' as never})
        ]) {
            expect(comparisonIntervals(comparison)).toBeNull();
            expect(generator.generate({comparison})).toBeNull();
        }
    });

    it('excludes isolated threshold magnitudes while retaining nonthreshold equality', () => {
        for (const {profile: comparison} of comparisonProfiles.filter(({profile: p}) => p.relation === 'equal')) {
            for (const draw of [0, 1 - Number.EPSILON]) {
                const spy = vi.spyOn(random, 'random').mockReturnValue(draw);
                try {
                    const result = generator.generate({comparison})!;
                    expect(result.data.num1).toBe(result.data.num2);
                    expect(CANONICAL_RANGE_THRESHOLDS.includes(Math.abs(result.data.num1) as never)).toBe(false);
                } finally { spy.mockRestore(); }
            }
        }
    });

    it('retains inclusive boundaries except the exact two-/three-digit source caps', () => {
        const spy = vi.spyOn(random, 'random').mockReturnValue(1 - Number.EPSILON);
        try {
            expect(generator.generate({comparison: profile(100, 10)})!.data.num2).toBe(99);
            expect(generator.generate({comparison: profile(1000, 100)})!.data.num2).toBe(999);
            expect(generator.generate({comparison: profile(100, 5)})!.data.num2).toBe(100);
            expect(generator.generate({comparison: profile(1000, 20)})!.data.num2).toBe(1000);
            const million = generator.generate({comparison: profile(1_000_000, 1000)})!.data;
            expect(million.num2).toBe(1_000_000);
            expect('task' in million && isValidMultiDigitComparisonProblem(million)).toBe(true);
        } finally { spy.mockRestore(); }
        const minimum = vi.spyOn(random, 'random').mockReturnValue(0);
        try {
            const thousand = generator.generate({comparison: profile(10_000, 1000)})!.data;
            expect(thousand.num1).toBe(1000);
            expect('task' in thousand && isValidMultiDigitComparisonProblem(thousand)).toBe(true);
        } finally { minimum.mockRestore(); }
    });

    it('preserves deterministic generation and the supplied place-value evidence', () => {
        const config = {comparison: profile(1_000_000, 100_000, {relation: 'greater'})};
        random.setSeed('canonical-comparison');
        const first = generator.generate(config)!;
        random.setSeed('canonical-comparison');
        expect(generator.generate(config)).toEqual(first);
        expect(first.data).toMatchObject({task: 'multi-digit-place-value-comparison', relation: 'greater'});
        expect('task' in first.data && isValidMultiDigitComparisonProblem(first.data)).toBe(true);
    });
});
