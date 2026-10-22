import type {StandardDivisionProblem, StandardDivisionStep} from '../../../../types/problems.ts';

/** Independent arithmetic oracles; tuples state column, partial, digit, product, remainder. */
function fixture(dividend: number, divisor: number, quotient: number, remainder: number,
    rows: readonly (readonly [number, number, number, number, number])[]): StandardDivisionProblem {
    const dividendDigits = [...String(dividend)].map(Number);
    const steps: StandardDivisionStep[] = rows.map(([columnIndex, partialDividend, quotientDigit, product, rest], index) => ({
        columnIndex, placeValue: 10 ** (dividendDigits.length - 1 - columnIndex),
        previousRemainder: index === 0 ? 0 : rows[index - 1]![4],
        broughtDownDigits: index === 0 ? dividendDigits.slice(0, columnIndex + 1) : [dividendDigits[columnIndex]!],
        partialDividend, quotientDigit, product, remainder: rest,
        ...(index + 1 < rows.length ? {nextBringDown: {
            sourceColumn: rows[index + 1]![0], digit: dividendDigits[rows[index + 1]![0]]!, partialDividend: rows[index + 1]![1]
        }} : {})
    }));
    return {kind: 'whole-number-standard-division', base: 10, dividend, divisor, quotient, remainder,
        dividendDigits, quotientStartColumn: rows[0]![0], quotientDigits: [...String(quotient)].map(Number), steps};
}

export const divisionCases = {
    internalZero: fixture(12625, 125, 101, 0, [[2, 126, 1, 125, 1], [3, 12, 0, 0, 12], [4, 125, 1, 125, 0]]),
    successiveZeros: fixture(12012, 12, 1001, 0, [[1, 12, 1, 12, 0], [2, 0, 0, 0, 0], [3, 1, 0, 0, 1], [4, 12, 1, 12, 0]]),
    trailingZero: fixture(10050, 125, 80, 50, [[3, 1005, 8, 1000, 5], [4, 50, 0, 0, 50]]),
    quotientZero: fixture(123, 456, 0, 123, [[2, 123, 0, 0, 123]]),
    remainder: fixture(82417, 321, 256, 241, [[2, 824, 2, 642, 182], [3, 1821, 5, 1605, 216], [4, 2167, 6, 1926, 241]])
} as const;
