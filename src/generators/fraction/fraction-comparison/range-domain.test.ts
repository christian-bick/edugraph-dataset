import {describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {comparisonPartCountUpper, hasComparisonPartCountUpper, sampleComparisonDenominators} from './range-domain.ts';

describe('fraction-comparison canonical part-count domain', () => {
    it.each([5, 10] as const)('validates the complete upper%s contract', upper => {
        expect(comparisonPartCountUpper(createCanonicalNumericRange(upper))).toBe(upper);
        expect(hasComparisonPartCountUpper(3, 4, upper)).toBe(upper === 5);
        expect(hasComparisonPartCountUpper(3, 8, upper)).toBe(upper === 10);
        expect(hasComparisonPartCountUpper(8, 8, upper)).toBe(upper === 10);
    });

    it.each([5, 10] as const)('samples every original ordered denominator pair conditioned on upper%s', upper => {
        const denominators = [2, 3, 4, 6, 8];
        const expected = denominators.flatMap(first => denominators
            .filter(second => first !== second && (Math.max(first, second) <= 5 ? 5 : 10) === upper)
            .map(second => ({first, second})));
        const actualMass = new Map<string, number>();
        expected.forEach(({first}, index) => {
            const seconds = expected.filter(pair => pair.first === first).map(pair => pair.second);
            seconds.forEach((second, secondIndex) => {
                const draw = vi.fn().mockReturnValueOnce((index + .5) / expected.length)
                    .mockReturnValueOnce((secondIndex + .5) / seconds.length);
                expect(sampleComparisonDenominators(upper, draw)).toEqual([first, second]);
                expect(draw).toHaveBeenCalledTimes(2);
                const key = `${first}:${second}`;
                actualMass.set(key, (actualMass.get(key) ?? 0) + 1 / (expected.length * seconds.length));
            });
        });
        expect(actualMass.size).toBe(upper === 5 ? 6 : 14);
        for (const mass of actualMass.values()) expect(mass).toBeCloseTo(1 / expected.length, 14);
    });

    it.each([NaN, Infinity, -.1, 1])('rejects invalid first draw %s', invalid => {
        const draw = vi.fn().mockReturnValue(invalid);
        expect(() => sampleComparisonDenominators(5, draw)).toThrow('half-open unit interval');
        expect(draw).toHaveBeenCalledTimes(1);
    });

    it.each([NaN, Infinity, -.1, 1])('rejects invalid second draw %s', invalid => {
        const draw = vi.fn().mockReturnValueOnce(0).mockReturnValueOnce(invalid);
        expect(() => sampleComparisonDenominators(10, draw)).toThrow('half-open unit interval');
        expect(draw).toHaveBeenCalledTimes(2);
    });

    it('rejects a corrupted minimum witness before sampling', () => {
        expect(() => comparisonPartCountUpper({...createCanonicalNumericRange(5), minimumBelow: 10})).toThrow('witnesses');
    });
});
