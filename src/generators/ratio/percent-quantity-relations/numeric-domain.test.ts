import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {greatestCommonDivisor} from '../helpers.ts';
import {percentRangeRows} from './numeric-domain.ts';

const uppers = [100, 120, 1000, 10000];

describe('compact canonical percent domains', () => {
    it('partitions every original declared-cap path with its exact conditional source mass', () => {
        const actual = uppers.map(upper => percentRangeRows(createCanonicalNumericRange(upper)));
        const lookup = actual.map(rows => new Map(rows.map(row => [`${row.percent}:${row.denominator}`, row])));
        const counts = uppers.map(() => 0), masses = uppers.map(() => 0);
        // Independent raw-draw census, including duplicate reduced-rational representations.
        for (let percent = 1; percent <= 150; percent++) {
            const maxNumerator = Math.floor(9999 / (percent / greatestCommonDivisor(percent, 100)));
            const percentMass = percent < 100 ? 1 / 3 / 99 : percent === 100 ? 1 / 3 : 1 / 3 / 50;
            for (const denominator of [1, 2, 4]) for (let numerator = 1; numerator <= maxNumerator; numerator++) {
                const maximum = Math.max(percent, 100, numerator / denominator,
                    numerator * percent / (denominator * 100));
                const band = uppers.findIndex(upper => maximum <= upper);
                const row = lookup[band]?.get(`${percent}:${denominator}`);
                if (!row || numerator < row.first || numerator > row.last) {
                    throw new Error(`Lost percent path ${percent}:${denominator}:${numerator}`);
                }
                counts[band]++;
                masses[band] += percentMass / 3 / maxNumerator;
            }
        }
        expect(counts).toEqual([61036, 19369, 218545, 264714]);
        expect(counts.reduce((sum, count) => sum + count, 0)).toBe(563664);
        actual.forEach((rows, band) => {
            expect(rows.reduce((sum, row) => sum + row.last - row.first + 1, 0)).toBe(counts[band]);
            expect(rows.reduce((sum, row) => sum + row.weight, 0)).toBeCloseTo(masses[band], 10);
        });
        expect(masses.reduce((sum, mass) => sum + mass, 0)).toBeCloseTo(1, 10);
    });

    it('retains the complete old smaller-cap support and inclusive catalog endpoints', () => {
        const all = uppers.flatMap(upper => percentRangeRows(createCanonicalNumericRange(upper)));
        for (let percent = 1; percent <= 150; percent++) {
            const oldMaximum = Math.floor(999 / (percent / greatestCommonDivisor(percent, 100)));
            for (const denominator of [1, 2, 4]) {
                const rows = all.filter(row => row.percent === percent && row.denominator === denominator);
                for (let numerator = 1; numerator <= oldMaximum; numerator++) {
                    if (rows.filter(row => numerator >= row.first && numerator <= row.last).length !== 1) {
                        throw new Error(`Lost or duplicated smaller-cap path ${percent}:${denominator}:${numerator}`);
                    }
                }
            }
        }
        expect(percentRangeRows(createCanonicalNumericRange(100))).toContainEqual(expect.objectContaining({
            percent: 100, denominator: 1, last: 100
        }));
        expect(percentRangeRows(createCanonicalNumericRange(120))).toContainEqual(expect.objectContaining({
            percent: 120, denominator: 1, last: 100
        }));
        expect(percentRangeRows(createCanonicalNumericRange(1000))).toContainEqual(expect.objectContaining({
            percent: 100, denominator: 1, last: 1000
        }));
    });

    it('rejects unsupported bounds and invalid canonical witnesses instead of falling back', () => {
        for (const range of [undefined, null, {}, {min: 0, max: 1000},
            createCanonicalNumericRange(5), createCanonicalNumericRange(100, 5),
            {...createCanonicalNumericRange(100), min: -0}, {...createCanonicalNumericRange(100), minimumBelow: 10}]) {
            expect(() => percentRangeRows(range as never)).toThrow();
        }
        const range = createCanonicalNumericRange(100);
        expect(percentRangeRows(range)).toBe(percentRangeRows(range));
    });
});
