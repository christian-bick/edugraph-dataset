import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {greatestCommonDivisor} from '../helpers.ts';

type PercentRow = Readonly<{
    percent: number;
    denominator: number;
    first: number;
    last: number;
    weight: number;
}>;
const cache = new Map<number, readonly PercentRow[]>();

/** Retain the union of the original declared source caps, including the larger
 * explicit cap. Counts here constrain readable fraction notation, not range labels. */
export const PERCENT_SOURCE_CAP = 9999;

/** Both tasks require the percentage's per-hundred equivalence, its scale factor,
 * the reference whole and the part. Ordinary fraction components are not extra inputs. */
export function percentRangeRows(range: CanonicalNumericRange): readonly PercentRow[] {
    if (!range || range.min !== 0 || Object.is(range.min, -0) || ![100, 120, 1000, 10000].includes(range.max)) {
        throw new Error('Choose a supported canonical percent range.');
    }
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow) {
        throw new Error('Invalid canonical percent range witnesses.');
    }
    const cached = cache.get(range.max);
    if (cached) return cached;
    const rows: PercentRow[] = [];
    for (let percent = 1; percent <= Math.min(150, range.max); percent++) {
        const reducedNumerator = percent / greatestCommonDivisor(percent, 100);
        const numeratorCount = Math.floor(PERCENT_SOURCE_CAP / reducedNumerator);
        const percentWeight = percent < 100 ? 1 / 297 : percent === 100 ? 1 / 3 : 1 / 150;
        for (const denominator of [1, 2, 4]) {
            // max(whole, part) = numerator * max(100, percent) / (100 * denominator).
            // The required per-hundred reference also witnesses an upper of at least 100.
            const scale = Math.max(100, percent);
            const first = scale > range.maximumAbove ? 1
                : Math.floor(range.maximumAbove * 100 * denominator / scale) + 1;
            const last = Math.min(numeratorCount, Math.floor(range.max * 100 * denominator / scale));
            if (first <= last) rows.push({percent, denominator, first, last,
                weight: (last - first + 1) * percentWeight / 3 / numeratorCount});
        }
    }
    cache.set(range.max, rows);
    return rows;
}
