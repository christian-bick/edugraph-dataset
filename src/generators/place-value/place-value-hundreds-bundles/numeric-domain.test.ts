import {describe, expect, it} from 'vitest';
import {hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import {hundredsBundleQuantities, hundredsBundleRangeProfiles, hundredsBundleRows} from './numeric-domain.ts';

describe('hundreds bundle canonical profiles', () => {
    it('separates one flat, small flat counts and larger flat counts without dropping any original model', () => {
        expect(hundredsBundleRangeProfiles.map(({range}) => [range.min, range.max])).toEqual([[0,100], [0,1000], [5,1000]]);
        expect(hundredsBundleRangeProfiles.map(({range}) => hundredsBundleRows(range, false).map(row => row.hundreds)))
            .toEqual([[1], [2,3,4], [5,6,7,8,9]]);
        expect(hundredsBundleRangeProfiles.map(({range}) => hundredsBundleRows(range, true).length)).toEqual([1,0,0]);
    });
    it('has the same range witnesses for value completion and the explained count-on-by-hundreds sequence', () => {
        for (const {range} of hundredsBundleRangeProfiles) for (const row of hundredsBundleRows(range, false)) {
            const base = hundredsBundleQuantities(row);
            const countOn = Array.from({length: row.hundreds}, (_, index) => (index + 1) * 100);
            expect(hasCanonicalRangeWitness(base, range)).toBe(true);
            expect(hasCanonicalRangeWitness([...base, ...countOn], range)).toBe(true);
        }
        const row = hundredsBundleRows(hundredsBundleRangeProfiles[0]!.range, true)[0]!;
        expect(hundredsBundleQuantities(row)).toEqual([1,10,100]);
        expect(hundredsBundleQuantities(row)).not.toContain(0);
    });
});
