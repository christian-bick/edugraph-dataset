import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

type Triple = readonly [number, number, number];
export type ScalingDecimalBlock = Readonly<{
    repeatedDigit: number;
    higherIndex: 0 | 1 | 2 | 3 | 4;
    wholes: readonly Triple[];
    fractionalDigits: readonly [readonly number[], readonly number[], readonly number[]];
    weight: number;
}>;
const digits = Array.from({length: 10}, (_, digit) => digit);
const cache = new Map<number, readonly ScalingDecimalBlock[]>();

/** Intersect the original independent digit proposals with a whole-part interval.
 * Whole charts keep one free digit; fractional charts keep four free digits. */
export function scalingDecimalRangeBlocks(range: CanonicalNumericRange): readonly ScalingDecimalBlock[] {
    if (!range || range.min !== 0 || ![10, 20, 100, 120, 1000].includes(range.max))
        throw new Error('Unsupported adjacent-place decimal range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new Error('Invalid adjacent-place decimal range witnesses.');
    const existing = cache.get(range.max);
    if (existing) return existing;
    const blocks: ScalingDecimalBlock[] = [];
    for (let repeatedDigit = 1; repeatedDigit <= 9; repeatedDigit++) for (const higherIndex of [0, 1, 2, 3, 4] as const) {
        const wholeCase = higherIndex < 2;
        const other = digits.filter(digit => digit !== repeatedDigit);
        const choices = Array.from({length: 6}, (_, index) =>
            index === higherIndex || index === higherIndex + 1 ? [repeatedDigit]
                : wholeCase && index >= 3 ? [0] : other);
        const at = (index: number): readonly number[] => choices[index]!;
        const wholes: Triple[] = [];
        for (const a of at(0)) for (const b of at(1)) for (const c of at(2)) {
            const whole = 100 * a + 10 * b + c;
            // Every fractional chart has a positive fractional part. The
            // required factor 10 is the upper10 witness for small numerals.
            if (wholeCase ? Math.max(whole, 10) <= range.max && Math.max(whole, 10) > range.maximumAbove
                : whole >= (range.max === 10 ? 0 : range.maximumAbove) && whole < range.max) wholes.push([a, b, c]);
        }
        if (!wholes.length) continue;
        const fractionalDigits = [at(3), at(4), at(5)] as const;
        const count = wholes.length * fractionalDigits.reduce((n, values) => n * values.length, 1);
        // The original repeat/position proposals are uniform. A one-free-digit
        // whole chart has 9^3 times the mass of a four-free-digit chart.
        blocks.push({repeatedDigit, higherIndex, wholes, fractionalDigits, weight: count * (wholeCase ? 729 : 1)});
    }
    cache.set(range.max, blocks);
    return blocks;
}
