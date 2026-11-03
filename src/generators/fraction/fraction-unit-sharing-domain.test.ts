import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {buildUnitPartitionProblem, buildUnitSharingProblem, unitSharingPairs} from './fraction-unit-sharing-domain.ts';

describe('unit-sharing mathematical domains', () => {
    it('partitions all 25 ordered pairs by the quantities each contract makes relevant', () => {
        for (const [contract, bands, expectedCounts] of [
            ['partition', [5, 10, 20, 100], [1, 7, 11, 6]],
            ['sharing', [5, 10], [20, 5]]
        ] as const) {
            const allPairs = new Set<string>();
            for (const [index, upper] of bands.entries()) {
                const pairs = unitSharingPairs(contract, createCanonicalNumericRange(upper));
                expect(pairs).toHaveLength(expectedCounts[index]!);
                for (const [b, n] of pairs) {
                    const magnitude = contract === 'partition' ? b * n : n;
                    const preceding = index === 0 ? 0 : bands[index - 1]!;
                    expect(magnitude).toBeGreaterThan(preceding);
                    expect(magnitude).toBeLessThanOrEqual(upper);
                    expect(allPairs.has(`${b}:${n}`)).toBe(false);
                    allPairs.add(`${b}:${n}`);
                }
            }
            expect(allPairs).toEqual(new Set(Array.from({length: 5}, (_, b) => b + 2)
                .flatMap(b => Array.from({length: 5}, (_, n) => `${b}:${n + 2}`))));
        }
    });

    it('rejects unsupported bounds and weakened canonical witnesses', () => {
        const valid = createCanonicalNumericRange(10);
        for (const range of [undefined, {...valid, min: 5}, {...valid, max: 1000},
            {...valid, maximumAbove: 0}, {...valid, minimumBelow: 1}]) {
            expect(() => unitSharingPairs('partition', range as never)).toThrow();
        }
        expect(() => unitSharingPairs('sharing', createCanonicalNumericRange(20))).toThrow();
        expect(() => unitSharingPairs('other' as never, valid)).toThrow();
    });

    it('rejects invalid native operands and relation profiles in either builder', () => {
        for (const build of [buildUnitPartitionProblem, buildUnitSharingProblem]) {
            for (const [b, n] of [[1, 2], [2, 1], [7, 2], [2, 7], [2.5, 3], [3, NaN]]) {
                expect(() => build(b!, n!, 'unit-dividend-basic', 'ribbon')).toThrow();
            }
            expect(() => build(2, 3, 'other' as never, 'ribbon')).toThrow();
        }
    });
});
