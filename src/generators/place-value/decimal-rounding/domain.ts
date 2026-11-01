import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {DecimalRoundingPlace} from '../../../types/problems.ts';

export const ROUNDING_PLACES: readonly DecimalRoundingPlace[] = [
    {name: 'hundreds', quantumInTenThousandths: 1_000_000},
    {name: 'tens', quantumInTenThousandths: 100_000},
    {name: 'ones', quantumInTenThousandths: 10_000},
    {name: 'tenths', quantumInTenThousandths: 1_000},
    {name: 'hundredths', quantumInTenThousandths: 100},
    {name: 'thousandths', quantumInTenThousandths: 10}
];
export type RoundingRangeBlock = Readonly<{
    roundingPlace: DecimalRoundingPlace;
    scenario: number;
    firstInterval: number;
    intervalStep: number;
    intervalCount: number;
    firstOffset: number;
    lastOffset: number;
    offsetCount: number;
    excludeWholeOffsets: boolean;
    weight: number;
}>;
const maximum = 10_000_000;
const cache = new Map<string, readonly RoundingRangeBlock[]>();
export const roundingOffsetCount = (first: number, last: number, excludeWhole: boolean): number => Math.max(0,
    last - first + 1 - (excludeWhole ? Math.floor(last / 10000) - Math.floor((first - 1) / 10000) : 0));

/** Rank selection skips precisely the integer inputs rejected by the old law. */
export function roundingOffsetAt(block: Pick<RoundingRangeBlock, 'firstOffset' | 'lastOffset' | 'excludeWholeOffsets'>, rank: number): number {
    if (!Number.isInteger(rank) || rank < 0 || rank >= roundingOffsetCount(block.firstOffset, block.lastOffset, block.excludeWholeOffsets))
        throw new Error('Invalid rounding-offset rank.');
    if (!block.excludeWholeOffsets) return block.firstOffset + rank;
    let low = block.firstOffset, high = block.lastOffset;
    while (low < high) {
        const middle = Math.floor((low + high) / 2);
        if (roundingOffsetCount(block.firstOffset, middle, true) > rank) high = middle;
        else low = middle + 1;
    }
    return low;
}

const clipIntervals = (first: number, last: number, step: number, minimum: number, maximum: number) => {
    const start = first + Math.max(0, Math.ceil((minimum - first) / step)) * step;
    return {first: start, count: Math.max(0, Math.floor((Math.min(last, maximum) - start) / step) + 1)};
};
const distanceSpans = (zero: boolean, range: CanonicalNumericRange, quantum: number): readonly (readonly [number, number])[] => {
    if (zero) return [[1, quantum - 1]];
    const first = Math.max(1, range.min * 10000), last = Math.min(quantum / 2, range.minimumBelow * 10000 - 1);
    if (first > last) return [];
    return last + 1 >= quantum - last ? [[first, quantum - first]] : [[first, last], [quantum - last, quantum - first]];
};
export const roundingOriginalOffsetSpan = (scenario: number, quantum: number): readonly [number, number] =>
    scenario === 2 && quantum <= 10000 ? [quantum / 2, quantum / 2]
        : scenario === 0 ? [1, quantum / 2 - 1] : [quantum / 2 + 1, quantum - 1];

/** Products of interval progressions and offset spans retain all old scenarios,
 * including their unequal carry domains and rejected whole-number inputs. */
export function decimalRoundingRangeBlocks(requireZero: boolean, range: CanonicalNumericRange): readonly RoundingRangeBlock[] {
    if (typeof requireZero !== 'boolean' || !range || ![5, 10, 20, 100, 120, 1000].includes(range.max)
        || ![0, 5, 10, 20].includes(range.min)) throw new Error('Unsupported decimal rounding profile.');
    const expected = createCanonicalNumericRange(range.max, range.min);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new Error('Invalid decimal rounding range witnesses.');
    const key = `${requireZero}:${range.min}:${range.max}`;
    const existing = cache.get(key);
    if (existing) return existing;
    if (requireZero && range.min > 0) return [];
    const blocks: RoundingRangeBlock[] = [];
    for (const roundingPlace of ROUNDING_PLACES) for (let scenario = 0; scenario < 4; scenario++) {
        const q = roundingPlace.quantumInTenThousandths, n = maximum / q;
        const firstAllowed = range.maximumAbove < 0 ? 0 : Math.floor(range.maximumAbove * 10000 / q);
        const lastAllowed = Math.floor(range.max * 10000 / q) - 1;
        if (scenario === 3) {
            if (requireZero) continue;
            const step = q >= 100000 ? 1 : q === 10000 ? 10 : 10000 / q;
            const originalCount = q >= 100000 ? 1 : q === 10000 ? 9 : 99;
            const first = q >= 100000 ? n - 1 : step - 1;
            const clipped = clipIntervals(first, first + (originalCount - 1) * step, step, firstAllowed, lastAllowed);
            const originalOffset = q * 4 / 5;
            const offset = (first * q + originalOffset) % 10000 === 0 ? originalOffset + 1 : originalOffset;
            const minimum = Math.min(first * q, offset, q - offset) / 10000;
            if (!clipped.count || minimum < range.min || minimum >= range.minimumBelow) continue;
            blocks.push({roundingPlace, scenario, firstInterval: clipped.first, intervalStep: step, intervalCount: clipped.count,
                firstOffset: offset, lastOffset: offset, offsetCount: 1, excludeWholeOffsets: false, weight: clipped.count / originalCount});
            continue;
        }
        const clipped = clipIntervals(requireZero ? 0 : 1, requireZero ? 0 : n - 1, 1, firstAllowed, lastAllowed);
        if (!clipped.count) continue;
        const [originalFirst, originalLast] = roundingOriginalOffsetSpan(scenario, q);
        const excludeWholeOffsets = q > 10000;
        const originalOffsets = roundingOffsetCount(originalFirst, originalLast, excludeWholeOffsets);
        for (const [first, last] of distanceSpans(requireZero, range, q)) {
            const firstOffset = Math.max(first, originalFirst), lastOffset = Math.min(last, originalLast);
            const offsetCount = roundingOffsetCount(firstOffset, lastOffset, excludeWholeOffsets);
            if (!offsetCount) continue;
            blocks.push({roundingPlace, scenario, firstInterval: clipped.first, intervalStep: 1, intervalCount: clipped.count,
                firstOffset, lastOffset, offsetCount, excludeWholeOffsets, weight: clipped.count / n * offsetCount / originalOffsets});
        }
    }
    cache.set(key, blocks);
    return blocks;
}
