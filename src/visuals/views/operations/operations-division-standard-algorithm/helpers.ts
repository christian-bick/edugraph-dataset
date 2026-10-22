import type {StandardDivisionProblem} from '../../../../types/problems.ts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
const isWhole = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
const isDigit = (value: unknown): value is number => isWhole(value) && value <= 9;
const sameDigits = (actual: unknown, expected: readonly number[]): actual is number[] =>
    Array.isArray(actual) && actual.length === expected.length
    && actual.every((digit: unknown, index: number) => isDigit(digit) && digit === expected[index]);
const numeralDigits = (value: number): number[] => [...String(value)].map(Number);

/** Checks the complete positional witness without restricting valid safe-integer operands. */
export function isValidStandardDivision(data: unknown): data is StandardDivisionProblem {
    if (!isRecord(data) || data.kind !== 'whole-number-standard-division' || data.base !== 10
        || !isWhole(data.dividend) || data.dividend < 10
        || !isWhole(data.divisor) || data.divisor === 0
        || !isWhole(data.quotient) || !isWhole(data.remainder) || data.remainder >= data.divisor
        || !isWhole(data.quotientStartColumn) || !Array.isArray(data.steps) || data.steps.length === 0) return false;

    const digits = numeralDigits(data.dividend);
    const quotientDigits = numeralDigits(data.quotient);
    if (!sameDigits(data.dividendDigits, digits) || !sameDigits(data.quotientDigits, quotientDigits)
        || data.steps.length !== quotientDigits.length
        || data.quotientStartColumn + data.steps.length !== digits.length
        || BigInt(data.dividend) !== BigInt(data.divisor) * BigInt(data.quotient) + BigInt(data.remainder)) return false;

    const divisor = data.divisor;
    let firstColumn = digits.findIndex((_, column) => Number(digits.slice(0, column + 1).join('')) >= divisor);
    if (firstColumn === -1) firstColumn = digits.length - 1;
    if (data.quotientStartColumn !== firstColumn) return false;

    let previousRemainder = 0;
    for (let index = 0; index < data.steps.length; index++) {
        const step: unknown = data.steps[index];
        const column = firstColumn + index;
        const consumed = index === 0 ? digits.slice(0, column + 1) : [digits[column]!];
        if (!isRecord(step) || step.columnIndex !== column
            || step.placeValue !== 10 ** (digits.length - 1 - column)
            || step.previousRemainder !== previousRemainder
            || !sameDigits(step.broughtDownDigits, consumed)
            || !isWhole(step.partialDividend) || !isDigit(step.quotientDigit)
            || step.quotientDigit !== quotientDigits[index]
            || !isWhole(step.product) || !isWhole(step.remainder)
            || step.remainder >= data.divisor
            || BigInt(step.partialDividend) !== BigInt(previousRemainder) * 10n ** BigInt(consumed.length)
                + BigInt(consumed.join(''))
            || BigInt(step.product) !== BigInt(data.divisor) * BigInt(step.quotientDigit)
            || BigInt(step.partialDividend) - BigInt(step.product) !== BigInt(step.remainder)) return false;

        if (step.nextBringDown !== undefined) {
            const next: unknown = data.steps[index + 1];
            const transition = step.nextBringDown;
            if (!isRecord(transition) || !isRecord(next)
                || transition.sourceColumn !== column + 1 || transition.digit !== digits[column + 1]
                || transition.partialDividend !== next.partialDividend) return false;
        }
        previousRemainder = step.remainder;
    }
    return previousRemainder === data.remainder;
}

/** Places supplied numeral digits so their right edge occupies an original dividend column. */
export function alignedDivisionDigits(value: number, endColumn: number, columnCount: number): readonly (number | null)[] {
    const digits = numeralDigits(value);
    const startColumn = endColumn + 1 - digits.length;
    return Array.from({length: columnCount}, (_, column) =>
        column >= startColumn && column <= endColumn ? digits[column - startColumn]! : null);
}

export const formatDivisionNumeral = (value: number): string =>
    String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
