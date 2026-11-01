import {hasCanonicalRangeWitness, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {ArithmeticOperation} from '../../../types/problems.ts';

/** Canonical operands and result, including the dimensionless group count. */
export type MeasurementIntegerTuple = readonly [first: number, second: number, answer: number];

const integers = (minimum: number, maximum: number): number[] =>
    Array.from({length: maximum - minimum + 1}, (_, index) => minimum + index);

/** The complete preceding finite support, partitioned before any random draw. */
export const measurementIntegerDomain: Record<ArithmeticOperation, readonly MeasurementIntegerTuple[]> = {
    addition: integers(2, 20).flatMap(first => integers(2, 20)
        .map(second => [first, second, first + second] as const)),
    subtraction: integers(2, 10).flatMap(second => integers(1, 15)
        .map(answer => [second + answer, second, answer] as const)),
    multiplication: integers(2, 6).flatMap(first => integers(2, 12)
        .map(second => [first, second, first * second] as const)),
    division: integers(2, 6).flatMap(second => integers(1, 12)
        .map(answer => [second * answer, second, answer] as const))
};

export function measurementIntegerTuples(
    operation: ArithmeticOperation,
    range: CanonicalNumericRange,
    largestOperandDigits?: 1 | 2
): readonly MeasurementIntegerTuple[] {
    return measurementIntegerDomain[operation].filter(values =>
        (largestOperandDigits === undefined
            || String(Math.max(values[0], values[1])).length === largestOperandDigits)
        && hasCanonicalRangeWitness(values, range));
}
