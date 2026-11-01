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
const zeroShare = (9 ** 4 - 8 ** 4) / 9 ** 4;
const cache = new Map<string, readonly ScalingDecimalBlock[]>();

/** Intersect the original first-zero blocks with a whole-part interval. Whole
 * charts keep their one free digit; fractional charts keep four free digits. */
export function scalingDecimalRangeBlocks(requireZero: boolean, range: CanonicalNumericRange): readonly ScalingDecimalBlock[] {
    if (typeof requireZero !== 'boolean' || !range || range.min !== 0 || ![10, 20, 100, 120, 1000].includes(range.max))
        throw new Error('Unsupported adjacent-place decimal zero profile or range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new Error('Invalid adjacent-place decimal range witnesses.');
    const key = `${requireZero}:${range.max}`;
    const existing = cache.get(key);
    if (existing) return existing;
    const blocks: ScalingDecimalBlock[] = [];
    for (let repeatedDigit = 1; repeatedDigit <= 9; repeatedDigit++) for (const higherIndex of [0, 1, 2, 3, 4] as const) {
        const wholeCase = higherIndex < 2;
        if (wholeCase && !requireZero) continue;
        const other = digits.filter(digit => digit !== repeatedDigit);
        const nonzeroOther = other.filter(digit => digit !== 0);
        const free = digits.slice(0, 6).filter(index => index !== higherIndex && index !== higherIndex + 1);
        for (const firstZero of requireZero && !wholeCase ? [0, 1, 2, 3] : [-1]) {
            const choices = Array.from({length: 6}, (_, index) => {
                if (index === higherIndex || index === higherIndex + 1) return [repeatedDigit];
                const freeIndex = free.indexOf(index);
                return wholeCase ? index >= 3 ? [0] : other
                    : freeIndex === firstZero ? [0] : !requireZero || freeIndex < firstZero ? nonzeroOther : other;
            });
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
            // The omitted common normalizer in the zero profile is
            // 2 + 3*zeroShare. Keeping per-path mass preserves its conditional law.
            const pathMass = requireZero ? wholeCase ? 1 / 81 : zeroShare / (9 * (9 ** 4 - 8 ** 4)) : 1 / (27 * 8 ** 4);
            blocks.push({repeatedDigit, higherIndex, wholes, fractionalDigits, weight: count * pathMass});
        }
    }
    cache.set(key, blocks);
    return blocks;
}
