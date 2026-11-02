import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {countingSupplyRows, groupingCountingProfiles, groupingCountsForRange,
    selectionCountingProfiles} from './canonical-counting-domains.ts';

describe('canonical counting domains', () => {
    it('retains207 pairs with exact original cap20 conditional probability ratios for all parities', () => {
        expect(selectionCountingProfiles).toHaveLength(6);
        const sizes = [];
        for (const parity of ['any', 'even', 'odd'] as const) {
            const covered = new Map<string, number>();
            for (const {range} of selectionCountingProfiles) {
                for (const row of countingSupplyRows(range, parity)) {
                    expect(Number.isSafeInteger(row.weight)).toBe(true);
                    for (let available = row.first; available <= row.last; available++) {
                        const key = `${row.requested}/${available}`;
                        expect(covered.has(key)).toBe(false);
                        covered.set(key, row.weight / (row.last - row.first + 1));
                        expect(hasCanonicalRangeWitness([row.requested, available], range)).toBe(true);
                        expect(row.weight / (row.last - row.first + 1)).toBe(232792560 / (21 - row.requested));
                    }
                }
            }
            const expected = [];
            for (let requested = 1; requested <= 20; requested++) for (let available = requested; available <= 20; available++) {
                if (requested === available && [5, 10, 20].includes(requested)
                    || parity !== 'any' && requested % 2 !== (parity === 'even' ? 0 : 1)) continue;
                expected.push(`${requested}/${available}`);
            }
            expect([...covered.keys()].sort()).toEqual(expected.sort());
            sizes.push(covered.size);
        }
        expect(sizes).toEqual([207, 98, 109]);
    });
    it('retains grouping thresholds because remainder and assessed group count2 prevent singleton claims', () => {
        expect(groupingCountingProfiles.map(({range}) => [range.min, range.max])).toEqual([[0, 5], [0, 10], [0, 20]]);
        const covered: number[] = [];
        for (const {range} of groupingCountingProfiles) for (const parity of ['even', 'singleton-odd', 'positive-odd'] as const) {
            for (const count of groupingCountsForRange(range, parity)) {
                covered.push(count);
                expect(hasCanonicalRangeWitness([count, 2, Math.floor(count / 2), count % 2], range)).toBe(true);
            }
        }
        expect(covered.sort((a, b) => a - b)).toEqual(Array.from({length: 20}, (_, index) => index + 1));
        expect(groupingCountsForRange(createCanonicalNumericRange(10), 'singleton-odd')).toEqual([]);
    });
    it('rejects malformed witness bounds rather than silently widening them', () => {
        const invalid = {...createCanonicalNumericRange(5), maximumAbove: 0};
        expect(countingSupplyRows(invalid, 'any')).toEqual([]);
        expect(groupingCountsForRange(invalid, 'even')).toEqual([]);
    });
});
