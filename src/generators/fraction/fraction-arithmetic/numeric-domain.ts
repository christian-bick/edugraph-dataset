import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import type {FractionArithmeticOperation, FractionParts} from '../../../types/problems.ts';

const denominators = [2, 3, 4, 6, 8] as const;
export function fractionArithmeticUpperBounds(task: string): readonly number[] {
    if (task.startsWith('unlike-')) return [];
    if (task === 'tenths-hundredths-addition') return [100];
    if (task === 'whole-number-fraction-product-proper') return [10];
    if (task === 'decompose-mixed' || task === 'whole-number-fraction-product-improper') return [5, 10, 20, 100];
    if (task === 'mixed-operation') return [10, 20, 100];
    return ['fraction-operation', 'decompose-proper', 'unit-fraction-multiple'].includes(task) ? [5, 10] : [];
}
type WeightedDenominator = Readonly<{denominator: FractionParts; weight: number}>;
export type BinaryFractionCase = WeightedDenominator & Readonly<{firstNumerator: number; secondNumerator: number}>;
export type DecompositionCase = WeightedDenominator & Readonly<{sourceNumerator: number}>;
export type ProductCase = WeightedDenominator & Readonly<{wholeFactor: number; fractionNumerator: number; productNumerator: number}>;
export type MixedCase = WeightedDenominator & Readonly<{firstNumerator: number; secondNumerator: number}>;

export function validateFractionArithmeticRange(range: CanonicalNumericRange): void {
    if (!range || range.min !== 0 || ![5, 10, 20, 100].includes(range.max))
        throw new GeneratorValidationError('fraction-arithmetic', 'Select a supported canonical same-whole range.');
    const expected = createCanonicalNumericRange(range.max);
    if (range.maximumAbove !== expected.maximumAbove || range.minimumBelow !== expected.minimumBelow)
        throw new GeneratorValidationError('fraction-arithmetic', 'Canonical range witnesses must agree with the bounds.');
}
const retain = <T>(rows: T[], range: CanonicalNumericRange, maximum: (row: T) => number): T[] => {
    validateFractionArithmeticRange(range);
    return rows.filter(row => maximum(row) <= range.max && maximum(row) > range.maximumAbove);
};

/** The denominator and nested numerator draws have unequal original path mass. */
export function binaryFractionCases(operation: FractionArithmeticOperation, range: CanonicalNumericRange): readonly BinaryFractionCase[] {
    const rows: BinaryFractionCase[] = [];
    for (const denominator of denominators) {
        const addition = operation === 'addition';
        for (let firstNumerator = addition ? 1 : 2; firstNumerator <= (addition ? denominator - 1 : denominator); firstNumerator++) {
            const count = addition ? denominator - firstNumerator : firstNumerator - 1;
            for (let secondNumerator = 1; secondNumerator <= count; secondNumerator++) rows.push({denominator, firstNumerator,
                secondNumerator, weight: 1 / 5 / (denominator - 1) / count});
        }
    }
    return retain(rows, range, row => row.denominator);
}

export function fractionDecompositionCases(kind: 'proper' | 'mixed', range: CanonicalNumericRange): readonly DecompositionCase[] {
    const source = kind === 'proper' ? [4, 6, 8] as const : denominators;
    const rows: DecompositionCase[] = [];
    for (const denominator of source) {
        const start = kind === 'proper' ? 3 : 1;
        for (let numerator = start; numerator < denominator; numerator++) rows.push({denominator,
            sourceNumerator: kind === 'proper' ? numerator : 2 * denominator + numerator,
            weight: 1 / source.length / (denominator - start)});
    }
    return retain(rows, range, row => kind === 'proper' ? row.denominator : row.sourceNumerator);
}

export function wholeFractionProductCases(kind: 'unit' | 'proper' | 'improper', range: CanonicalNumericRange): readonly ProductCase[] {
    const rows: ProductCase[] = [];
    for (const denominator of kind === 'unit' ? denominators : [3, 4, 6, 8] as const)
        for (let fractionNumerator = kind === 'unit' ? 1 : 2; fractionNumerator <= (kind === 'unit' ? 1 : denominator - 1); fractionNumerator++)
            for (let wholeFactor = 2; wholeFactor <= 4; wholeFactor++) {
                const productNumerator = wholeFactor * fractionNumerator;
                if (kind !== 'unit' && (productNumerator > 4 * denominator || productNumerator % denominator === 0
                    || (productNumerator < denominator) !== (kind === 'proper'))) continue;
                rows.push({denominator, fractionNumerator, wholeFactor, productNumerator, weight: 1});
            }
    const originalCount = rows.length;
    return retain(rows.map(row => ({...row, weight: 1 / originalCount})), range, row => Math.max(row.denominator, row.productNumerator));
}

/** Regroup/straight paths retain the original half-share and nested draw law. */
export function mixedFractionCases(operation: FractionArithmeticOperation, range: CanonicalNumericRange): readonly MixedCase[] {
    const rows: MixedCase[] = [];
    for (const regroup of [true, false]) for (const denominator of [3, 4, 6, 8] as const) {
        const addition = operation === 'addition';
        const firstStart = addition ? regroup ? 2 : 1 : regroup ? 1 : 2;
        const firstEnd = addition ? regroup ? denominator - 1 : denominator - 2 : regroup ? denominator - 2 : denominator - 1;
        for (let firstNumerator = firstStart; firstNumerator <= firstEnd; firstNumerator++) {
            const secondStart = addition ? regroup ? denominator - firstNumerator + 1 : 1 : regroup ? firstNumerator + 1 : 1;
            const secondEnd = addition ? regroup ? denominator - 1 : denominator - firstNumerator - 1 : regroup ? denominator - 1 : firstNumerator - 1;
            for (let secondNumerator = secondStart; secondNumerator <= secondEnd; secondNumerator++) rows.push({denominator,
                firstNumerator, secondNumerator, weight: 1 / 2 / 4 / (firstEnd - firstStart + 1) / (secondEnd - secondStart + 1)});
        }
    }
    return retain(rows, range, row => operation === 'addition' ? 2 * row.denominator + row.firstNumerator + row.secondNumerator
        : 2 * row.denominator + row.firstNumerator);
}
