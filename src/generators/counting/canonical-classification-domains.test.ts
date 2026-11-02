import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../lib/canonical-numeric-range.ts';
import {classificationRangeProfiles, classificationRows, sampleClassificationAllocation} from './canonical-classification-domains.ts';

describe('canonical classification allocations', () => {
    it('uniquely covers every original allocation except the threshold-only5/5/5 task', () => {
        expect(classificationRangeProfiles.map(({range}) => [range.min, range.max])).toEqual([[0, 5], [0, 10], [5, 10], [0, 20]]);
        const actual = new Set<string>();
        for (const {range} of classificationRangeProfiles) for (const row of classificationRows(range)) {
            const key = row.counts.join('/');
            expect(actual.has(key)).toBe(false);
            expect(hasCanonicalRangeWitness(row.counts, range)).toBe(true);
            actual.add(key);
        }
        const expected = ['1', '1/1'];
        for (let a = 1; a <= 18; a++) for (let b = 1; b <= 19 - a; b++) for (let c = 1; c <= 20 - a - b; c++) {
            if (a === 5 && b === 5 && c === 5) continue;
            expected.push([a, b, c].join('/'));
        }
        expect([...actual].sort()).toEqual(expected.sort());
        expect(actual.size).toBe(1141);
    });
    it('matches exact original path multiplicities using an independent placement dynamic program', () => {
        const rows = classificationRangeProfiles.flatMap(({range}) => classificationRows(range));
        let distribution = new Map([['0/0/0', 1]]);
        for (let remaining = 0; remaining <= 17; remaining++) {
            for (const [key, multiplicity] of distribution) {
                const counts = key.split('/').map(value => Number(value) + 1);
                const row = rows.find(row => row.counts.join('/') === counts.join('/'));
                if (counts.every(count => count === 5)) { expect(row).toBeUndefined(); continue; }
                expect(row?.weight).toBe(multiplicity * 3 ** (17 - remaining));
                expect(Number.isSafeInteger(row!.weight)).toBe(true);
            }
            const next = new Map<string, number>();
            for (const [key, multiplicity] of distribution) for (let category = 0; category < 3; category++) {
                const counts = key.split('/').map(Number);
                counts[category] = counts[category]! + 1;
                const updated = counts.join('/');
                next.set(updated, (next.get(updated) ?? 0) + multiplicity);
            }
            distribution = next;
        }
        for (const counts of [[1], [1, 1]]) expect(rows.find(row => row.counts.join('/') === counts.join('/'))!.weight).toBe(3 ** 17);
    });
    it('preserves all and only the original relation-feasible triples, including permitted ties', () => {
        for (const relation of ['least', 'most', 'ascending', 'descending'] as const) {
            const rows = classificationRangeProfiles.flatMap(({range}) => classificationRows(range, relation));
            const expected = [];
            for (let a = 1; a <= 18; a++) for (let b = 1; b <= 19 - a; b++) for (let c = 1; c <= 20 - a - b; c++) {
                const counts = [a, b, c];
                if (new Set(counts).size < 2) continue;
                if (relation === 'least' && counts.filter(count => count === Math.min(...counts)).length !== 1
                    || relation === 'most' && counts.filter(count => count === Math.max(...counts)).length !== 1) continue;
                expected.push(counts.join('/'));
            }
            expect(rows.map(row => row.counts.join('/')).sort()).toEqual(expected.sort());
            expect(rows.some(row => new Set(row.counts).size === 2)).toBe(true);
        }
    });
    it('bounds asked category counts rather than the unasked stored total', () => {
        const range = createCanonicalNumericRange(5);
        expect(classificationRows(range).some(row => row.counts.join('/') === '3/3/4')).toBe(true);
        expect(hasCanonicalRangeWitness([3, 3, 4], range)).toBe(true);
        expect(hasCanonicalRangeWitness([3, 3, 4, 10], range)).toBe(false);
        expect(classificationRows(createCanonicalNumericRange(20, 5))).toEqual([]);
        expect(classificationRows({...range, maximumAbove: 0})).toEqual([]);
        let draws = 0;
        expect(sampleClassificationAllocation([], () => { draws++; return 0; })).toBeUndefined();
        expect(draws).toBe(0);
        const rows = classificationRows(range);
        expect(sampleClassificationAllocation(rows, () => 1)).toBe(rows[rows.length - 1]);
    });
});
