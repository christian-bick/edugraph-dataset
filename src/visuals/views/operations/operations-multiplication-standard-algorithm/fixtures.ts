import type {
    StandardMultiplicationPartialRow,
    StandardMultiplicationProblem,
    StandardMultiplicationSumColumn
} from '../../../../types/problems.ts';

const digit = (value: number, place: number): number => Math.floor(value / 10 ** place) % 10;

/** Builds independent test witnesses, including zero multiplier passes. */
export function multiplicationCase(multiplicand: number, multiplier: number): StandardMultiplicationProblem {
    const multiplicandDigits = String(multiplicand).length;
    const multiplierDigits = String(multiplier).length;
    const product = multiplicand * multiplier;
    const partialRows: StandardMultiplicationPartialRow[] = Array.from({length: multiplierDigits}, (_, shiftPlaces) => {
        const multiplierDigit = digit(multiplier, shiftPlaces);
        let carryIn = 0;
        const columns = Array.from({length: multiplicandDigits}, (_, placeIndex) => {
            const multiplicandDigit = digit(multiplicand, placeIndex);
            const workingValue = multiplicandDigit * multiplierDigit + carryIn;
            const resultDigit = workingValue % 10;
            const carryOut = Math.floor(workingValue / 10);
            const step = {placeIndex, multiplicandDigit, carryIn, workingValue, resultDigit, carryOut};
            carryIn = carryOut;
            return step;
        });
        const unshiftedProduct = multiplicand * multiplierDigit;
        return {shiftPlaces, multiplierDigit, columns, leadingCarry: carryIn,
            unshiftedProduct, alignedProduct: unshiftedProduct * 10 ** shiftPlaces};
    });
    let carryIn = 0;
    const sumColumns: StandardMultiplicationSumColumn[] = Array.from({length: String(product).length}, (_, placeIndex) => {
        const addendDigits = partialRows.map(row => digit(row.alignedProduct, placeIndex));
        const workingValue = addendDigits.reduce((sum, addendDigit) => sum + addendDigit, carryIn);
        const resultDigit = workingValue % 10;
        const carryOut = Math.floor(workingValue / 10);
        const column = {placeIndex, addendDigits, carryIn, workingValue, resultDigit, carryOut};
        carryIn = carryOut;
        return column;
    });
    return {kind: 'whole-number-standard-multiplication', multiplicand, multiplier,
        product, partialRows, sumColumns};
}
