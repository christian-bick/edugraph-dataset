import {describe, expect, it} from 'vitest';
import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {flexibleStrategyRows, type FlexibleStrategy} from './domain.ts';

const cases = [
    ['addition-make-ten', 3956], ['addition-near-doubles', 998],
    ['addition-compensation-single', 36], ['addition-compensation-multiple', 444573],
    ['subtraction-compensation-single', 36], ['subtraction-compensation-multiple', 444573],
    ['subtraction-make-ten', 81], ['subtraction-think-addition', 444609]
] as const;
const ranges = canonicalRangeProfiles.filter(({range}) => range.max <= 1000 && [0, 5].includes(range.min));

const requiredExtremes = (strategy: FlexibleStrategy, anchor: number, tail: number): [number, number] => {
    if (strategy === 'addition-near-doubles') return [1, 2 * anchor + 1];
    if (strategy === 'addition-make-ten') return [Math.min(10 - anchor, tail), 10 + tail];
    if (strategy === 'subtraction-make-ten') return [Math.min(anchor, tail, 10 - tail), 10 + anchor];
    const adjustment = 10 - anchor % 10;
    return [Math.min(anchor, adjustment, tail), anchor + adjustment + tail];
};

/** Independent original source-domain membership, including both width alternatives. */
const originalParameters = (strategy: FlexibleStrategy, visit: (anchor: number, tail: number) => void): void => {
    if (strategy === 'addition-near-doubles') {
        for (let base = 1; base <= 499; base++) for (let orientation = 0; orientation <= 1; orientation++) visit(base, orientation);
    } else if (strategy === 'addition-make-ten') {
        for (let left = 6; left <= 9; left++) for (let right = 11 - left; left + right <= 999; right++) visit(left, right - (10 - left));
    } else if (strategy === 'subtraction-make-ten') {
        for (let left = 11; left <= 19; left++) for (let right = left - 9; right < left; right++) visit(left - 10, right - (left - 10));
    } else {
        for (let right = 1; right < 1000; right++) {
            if (right % 10 === 0) continue;
            const adjustment = 10 - right % 10;
            for (let tail = 1; right + adjustment + tail < 1000; tail++) {
                const left = strategy.startsWith('addition-compensation') ? tail + adjustment
                    : strategy.startsWith('subtraction-compensation') ? right + tail : right + adjustment + tail;
                if (strategy.endsWith('-single') && Math.max(left, right) >= 10) continue;
                if (strategy.endsWith('-multiple') && Math.max(left, right) < 10) continue;
                visit(right, tail);
            }
        }
    }
};

describe('compact flexible-strategy canonical domains', () => {
    it.each(cases)('preserves every original %s frame with the original conditional row law', (strategy, count) => {
        const seen = new Uint8Array(1_000_000);
        let covered = 0;
        for (const {range} of ranges) {
            const rows = flexibleStrategyRows(strategy, range);
            for (const row of rows) {
                const originalCount = strategy === 'addition-near-doubles' ? 2
                    : strategy === 'addition-make-ten' ? 989 : strategy === 'subtraction-make-ten' ? 9
                        : 999 - (row.anchor + 10 - row.anchor % 10);
                expect(row.weight / (row.maximum - row.minimum + 1)).toBeCloseTo(1 / originalCount, 14);
                for (let tail = row.minimum; tail <= row.maximum; tail++) {
                    const index = row.anchor * 1000 + tail;
                    if (seen[index]) throw new Error(`Duplicate ${strategy} frame ${row.anchor}:${tail}.`);
                    seen[index] = 1;
                    covered++;
                    const [minimum, maximum] = requiredExtremes(strategy, row.anchor, tail);
                    const expectedUpper = [5, 10, 20, 100, 120, 1000].find(upper => maximum <= upper);
                    const expectedLower = minimum >= 5 ? 5 : 0;
                    if (range.max !== expectedUpper || range.min !== expectedLower || minimum <= 0 || maximum >= 1000) {
                        throw new Error(`Noncanonical ${strategy} frame ${row.anchor}:${tail}: ${minimum}..${maximum}.`);
                    }
                }
            }
        }
        let originalCount = 0;
        originalParameters(strategy, (anchor, tail) => {
            if (seen[anchor * 1000 + tail] !== 1) throw new Error(`Missing original ${strategy} frame ${anchor}:${tail}.`);
            originalCount++;
        });
        expect(originalCount).toBe(count);
        expect(covered).toBe(count);
    });
});
