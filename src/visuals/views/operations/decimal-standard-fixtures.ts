import type {
    DecimalStandardAddSubtractProblem, DecimalStandardDivisionProblem, DecimalStandardMultiplicationProblem,
    ExactDecimalValue, StandardMultiplicationPartialRow, StandardMultiplicationSumColumn
} from '../../../types/problems.ts';

const decimal = (numeral: string): ExactDecimalValue => ({numeral, coefficient: Number(numeral.replace('.', '')),
    scale: numeral.includes('.') ? numeral.length - numeral.indexOf('.') - 1 : 0});

/** Literal column oracles, independent of generator calculation. */
function addSubtract(operation: 'addition' | 'subtraction', top: string, bottom: string, result: string,
    topAligned: string, bottomAligned: string, rows: readonly (readonly [number, number, 0 | 1, 0 | 1, number, number])[]): DecimalStandardAddSubtractProblem {
    const alignedTop = decimal(topAligned);
    const alignedBottom = decimal(bottomAligned);
    return {kind: 'decimal-standard-add-subtract', base: 10, operation, top: decimal(top), bottom: decimal(bottom), result: decimal(result),
        alignment: {scale: alignedTop.scale, topCoefficient: alignedTop.coefficient, bottomCoefficient: alignedBottom.coefficient,
            topNumeral: topAligned, bottomNumeral: bottomAligned},
        columns: rows.map(([topDigit, bottomDigit, regroupIn, regroupOut, workingValue, resultDigit], index) => ({
            placeExponent: index - alignedTop.scale, topDigit, bottomDigit, regroupIn, regroupOut, workingValue, resultDigit}))};
}

export const decimalAdditionOracle = addSubtract('addition', '9.995', '0.005', '10.000', '9.995', '0.005', [
    [5, 5, 0, 1, 10, 0], [9, 0, 1, 1, 10, 0], [9, 0, 1, 1, 10, 0], [9, 0, 1, 1, 10, 0], [0, 0, 1, 0, 1, 1]
]);
export const decimalBorrowOracle = addSubtract('subtraction', '100.005', '0.017', '99.988', '100.005', '0.017', [
    [5, 7, 0, 1, 15, 8], [0, 1, 1, 1, 9, 8], [0, 0, 1, 1, 9, 9], [0, 0, 1, 1, 9, 9], [0, 0, 1, 1, 9, 9], [1, 0, 1, 0, 0, 0]
]);
export const decimalAlignmentOracle = addSubtract('subtraction', '5.20', '0.004', '5.196', '5.200', '0.004', [
    [0, 4, 0, 1, 10, 6], [0, 0, 1, 1, 9, 9], [2, 0, 1, 0, 1, 1], [5, 0, 0, 0, 5, 5]
]);

function partial(shiftPlaces: number, multiplierDigit: number, unshiftedProduct: number, alignedProduct: number,
    rows: readonly (readonly [number, number, number, number, number])[], leadingCarry: number): StandardMultiplicationPartialRow {
    return {shiftPlaces, multiplierDigit, unshiftedProduct, alignedProduct, leadingCarry,
        columns: rows.map(([multiplicandDigit, carryIn, workingValue, resultDigit, carryOut], placeIndex) => ({
            placeIndex, multiplicandDigit, carryIn, workingValue, resultDigit, carryOut}))};
}
function sums(rows: readonly (readonly [readonly number[], number, number, number, number])[]): StandardMultiplicationSumColumn[] {
    return rows.map(([addendDigits, carryIn, workingValue, resultDigit, carryOut], placeIndex) => ({
        placeIndex, addendDigits, carryIn, workingValue, resultDigit, carryOut}));
}
export const decimalMultiplicationOracle: DecimalStandardMultiplicationProblem = {
    kind: 'decimal-standard-multiplication', base: 10, multiplicand: decimal('2.05'), multiplier: decimal('0.304'),
    multiplicandDigits: [2, 0, 5], multiplierDigits: [3, 0, 4], product: decimal('0.62320'), unscaledProduct: 62320,
    partialRows: [partial(0, 4, 820, 820, [[5, 0, 20, 0, 2], [0, 2, 2, 2, 0], [2, 0, 8, 8, 0]], 0),
        partial(1, 0, 0, 0, [[5, 0, 0, 0, 0], [0, 0, 0, 0, 0], [2, 0, 0, 0, 0]], 0),
        partial(2, 3, 615, 61500, [[5, 0, 15, 5, 1], [0, 1, 1, 1, 0], [2, 0, 6, 6, 0]], 0)],
    sumColumns: sums([[[0, 0, 0], 0, 0, 0, 0], [[2, 0, 0], 0, 2, 2, 0], [[8, 0, 5], 0, 13, 3, 1],
        [[0, 0, 1], 1, 2, 2, 0], [[0, 0, 6], 0, 6, 6, 0]]),
    decimalPlacement: {totalScale: 5, coefficientDigits: [6, 2, 3, 2, 0], paddedDigits: [0, 6, 2, 3, 2, 0], decimalIndex: 1}
};

/** Tuples supply end column, previous remainder, partial, quotient digit, product, remainder. */
function division(dividend: string, divisor: string, quotient: string, normalized: string, normalizedDivisor: number,
    sourceDigits: readonly number[], decimalIndex: number, rows: readonly (readonly [number, number, number, number, number, number])[]): DecimalStandardDivisionProblem {
    const originalDivisor = decimal(divisor);
    return {kind: 'decimal-standard-division', base: 10, dividend: decimal(dividend), divisor: originalDivisor, quotient: decimal(quotient),
        normalization: {shiftPlaces: originalDivisor.scale, powerOfTen: 10 ** originalDivisor.scale, dividend: decimal(normalized), divisor: normalizedDivisor},
        sourceDigits, decimalIndex, quotientStartColumn: rows[0]![0], quotientDigits: rows.map(row => row[3]),
        steps: rows.map(([endColumnIndex, previousRemainder, partialDividend, quotientDigit, product, remainder], index) => ({
            endColumnIndex, quotientPlaceExponent: decimalIndex - 1 - endColumnIndex,
            source: endColumnIndex < sourceDigits.length ? 'original' : 'extension-zero', previousRemainder,
            broughtDownDigits: index === 0 ? sourceDigits.slice(0, endColumnIndex + 1) : [endColumnIndex < sourceDigits.length ? sourceDigits[endColumnIndex]! : 0],
            partialDividend, quotientDigit, product, remainder}))};
}
export const decimalDivisionOracle = division('12.345', '0.3', '41.15', '123.45', 3, [1, 2, 3, 4, 5], 3, [
    [1, 0, 12, 4, 12, 0], [2, 0, 3, 1, 3, 0], [3, 0, 4, 1, 3, 1], [4, 1, 15, 5, 15, 0]
]);
export const decimalExtensionOracle = division('12.3', '0.5', '24.6', '123', 5, [1, 2, 3], 3, [
    [1, 0, 12, 2, 10, 2], [2, 2, 23, 4, 20, 3], [3, 3, 30, 6, 30, 0]
]);
export const decimalSmallDivisionOracle = division('0.0012', '0.3', '0.004', '0.012', 3, [0, 0, 1, 2], 1, [
    [0, 0, 0, 0, 0, 0], [1, 0, 0, 0, 0, 0], [2, 0, 1, 0, 0, 1], [3, 1, 12, 4, 12, 0]
]);
export const decimalTrailingDivisionOracle = division('1.20', '0.3', '4.0', '12.0', 3, [1, 2, 0], 2, [
    [1, 0, 12, 4, 12, 0], [2, 0, 0, 0, 0, 0]
]);
