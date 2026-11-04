import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

export type ExpandedDecimalBlock = Readonly<{
    pattern: number;
    wholes: readonly number[];
    digits: readonly [readonly number[], readonly number[], readonly number[]];
    weight: number;
}>;
const positiveDigits = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const smallDigits = [1, 2, 3, 4, 5];
const largeDigits = [6, 7, 8, 9];
const wholeParts = Array.from({length: 999}, (_, index) => index + 1);
const patterns = [[false, false, true], [true, false, true], [true, true, true], [false, true, true], [true, false, true]] as const;
// A common integer scale for the original uniform five-pattern law. Each
// pattern's native paths have equal mass, although the pattern sizes differ.
const pathWeights = [899100, 9890100, 1100, 98901, 10989] as const;
const cache = new Map<number, readonly ExpandedDecimalBlock[]>();

/** Compact disjoint blocks of the original five patterns. The coefficient is a
 * factor in the requested expanded expression, while its unit remains rational. */
export function expandedDecimalRangeBlocks(range: CanonicalNumericRange): readonly ExpandedDecimalBlock[] {
    if (!range || range.min !== 0 || ![5, 10, 20, 100, 120, 1000].includes(range.max))
        throw new Error('Unsupported expanded-decimal range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new Error('Invalid expanded-decimal range witnesses.');
    const cached = cache.get(range.max);
    if (cached) return cached;
    const sourceWholes = [Array.from({length: 99}, (_, index) => index + 1), [0], wholeParts,
        Array.from({length: 100}, (_, index) => index), Array.from({length: 900}, (_, index) => index + 100)];
    const blocks: ExpandedDecimalBlock[] = [];
    for (const [pattern, free] of patterns.entries()) {
        const originalWholes = sourceWholes[pattern]!;
        const append = (minimum: number, maximum: number, choices: readonly (readonly number[])[]) => {
            const wholes = originalWholes.filter(whole => whole >= minimum && whole <= maximum);
            if (!wholes.length) return;
            const digits = free.map((nonzero, index) => nonzero ? choices[index]! : [0]) as unknown as ExpandedDecimalBlock['digits'];
            const count = wholes.length * digits.reduce((total, values) => total * values.length, 1);
            blocks.push({pattern, wholes, digits, weight: count * pathWeights[pattern]!});
        };
        if (range.max === 5) append(0, 4, [smallDigits, smallDigits, smallDigits]);
        else if (range.max === 10) {
            append(5, 9, [positiveDigits, positiveDigits, positiveDigits]);
            // First large coefficient partitions low-whole upper10 values
            // without retrying or adding a value outside the old source law.
            for (let first = 0; first < 3; first++) if (free[first]) append(0, 4,
                free.map((_, index) => index < first ? smallDigits : index === first ? largeDigits : positiveDigits));
        } else append(range.maximumAbove, range.max - 1, [positiveDigits, positiveDigits, positiveDigits]);
    }
    cache.set(range.max, blocks);
    return blocks;
}
