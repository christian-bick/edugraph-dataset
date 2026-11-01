import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';

export const STANDARD_DECIMAL_MULTIPLIERS = [0, 1, 2, 4, 5, 8, 10, 12, 20, 25, 50, 101, 102, 105, 110] as const;
export type StandardDecimalMultiplicationCase = Readonly<{
    firstScale: number;
    secondCoefficient: number;
    minimum: number;
    maximum: number;
    weight: number;
}>;
const cache = new Map<number, readonly StandardDecimalMultiplicationCase[]>();

/** Preserve the old explicit-cap law on its two existing capabilities. Finer
 * bands condition the former omitted-range corpus; these are distinct laws. */
export const decimalMultiplicationSourceCap = (upper: number): number => upper === 100000 || upper === 1000000 ? upper : 999999;

export function standardDecimalMultiplicationCases(range: CanonicalNumericRange): readonly StandardDecimalMultiplicationCase[] {
    if (!range || range.min !== 0 || ![100, 120, 1000, 10000, 100000, 1000000].includes(range.max))
        throw new GeneratorValidationError('standard-algorithm-decimal-multiplication', 'Select a supported canonical coefficient-arithmetic range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new GeneratorValidationError('standard-algorithm-decimal-multiplication', 'Canonical range witnesses must agree with the selected bounds.');
    const existing = cache.get(range.max);
    if (existing) return existing;
    const cap = decimalMultiplicationSourceCap(range.max);
    const cases: StandardDecimalMultiplicationCase[] = [];
    for (const firstScale of [1, 2, 3]) {
        const sourceMinimum = 10 * 10 ** firstScale;
        const choices = STANDARD_DECIMAL_MULTIPLIERS.filter(value => value * sourceMinimum <= cap);
        for (const secondCoefficient of choices) {
            const sourceMaximum = secondCoefficient === 0 ? cap : Math.floor(cap / secondCoefficient);
            // Coefficient rows are prescribed work, not decimal storage. The
            // product dominates for m>=2; the first coefficient dominates at0/1.
            const factor = Math.max(1, secondCoefficient);
            const minimum = Math.max(sourceMinimum, Math.floor(range.maximumAbove / factor) + 1);
            const maximum = Math.min(sourceMaximum, Math.floor(range.max / factor));
            if (minimum > maximum) continue;
            cases.push({firstScale, secondCoefficient, minimum, maximum,
                weight: 1 / 3 / choices.length * (maximum - minimum + 1) / (sourceMaximum - sourceMinimum + 1)});
        }
    }
    cache.set(range.max, cases);
    return cases;
}
