import type {StandardMultiplicationProblem} from '../../../../types/problems.ts';

export const PLACE_NAMES = ['ones', 'tens', 'hundreds'] as const;

export const digitAt = (value: number, placeIndex: number): number =>
    Math.floor(value / 10 ** placeIndex) % 10;

/** Formats the complete 4-by-3 digit product domain, including seven-digit answers. */
export function formatMultiplicationNumeral(value: number): string {
    if (!Number.isSafeInteger(value) || value < 0 || value > 9999 * 999) {
        throw new RangeError('Expected a standard-multiplication whole number.');
    }
    return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const isSafeWhole = (value: number): boolean => Number.isSafeInteger(value) && value >= 0;
const isDigit = (value: number): boolean => Number.isInteger(value) && value >= 0 && value <= 9;

/** Verifies every multiplication pass and the final column-by-column sum. */
export function validStandardMultiplication(data: StandardMultiplicationProblem): boolean {
    if (!data || data.kind !== 'whole-number-standard-multiplication'
        || !isSafeWhole(data.multiplicand) || data.multiplicand < 10 || data.multiplicand > 9999
        || !isSafeWhole(data.multiplier) || data.multiplier < 10 || data.multiplier > 999
        || !isSafeWhole(data.product) || data.product !== data.multiplicand * data.multiplier
        || !Array.isArray(data.partialRows) || !Array.isArray(data.sumColumns)) return false;

    const multiplicandDigits = String(data.multiplicand).length;
    const multiplierDigits = String(data.multiplier).length;
    if (data.partialRows.length !== multiplierDigits
        || data.sumColumns.length !== String(data.product).length) return false;

    for (let rowIndex = 0; rowIndex < multiplierDigits; rowIndex++) {
        const row = data.partialRows[rowIndex];
        const multiplierDigit = digitAt(data.multiplier, rowIndex);
        if (!row || row.shiftPlaces !== rowIndex || row.multiplierDigit !== multiplierDigit
            || !Array.isArray(row.columns) || row.columns.length !== multiplicandDigits
            || !isSafeWhole(row.leadingCarry) || !isSafeWhole(row.unshiftedProduct)
            || !isSafeWhole(row.alignedProduct)) return false;
        let expectedCarry = 0;
        let reconstructed = 0;
        for (let index = 0; index < multiplicandDigits; index++) {
            const step = row.columns[index];
            const multiplicandDigit = digitAt(data.multiplicand, index);
            const workingValue = multiplicandDigit * multiplierDigit + expectedCarry;
            const carryOut = Math.floor(workingValue / 10);
            if (!step || step.placeIndex !== index || step.multiplicandDigit !== multiplicandDigit
                || !isDigit(step.resultDigit) || !isSafeWhole(step.carryIn)
                || !isSafeWhole(step.workingValue) || !isSafeWhole(step.carryOut)
                || step.carryIn !== expectedCarry || step.workingValue !== workingValue
                || step.resultDigit !== workingValue % 10 || step.carryOut !== carryOut) return false;
            reconstructed += step.resultDigit * 10 ** index;
            expectedCarry = carryOut;
        }
        reconstructed += expectedCarry * 10 ** multiplicandDigits;
        if (row.leadingCarry !== expectedCarry
            || row.unshiftedProduct !== reconstructed
            || row.unshiftedProduct !== data.multiplicand * multiplierDigit
            || row.alignedProduct !== row.unshiftedProduct * 10 ** rowIndex) return false;
    }
    if (data.partialRows.reduce((sum, row) => sum + row.alignedProduct, 0) !== data.product) return false;

    let expectedCarry = 0;
    let reconstructed = 0;
    for (let index = 0; index < data.sumColumns.length; index++) {
        const column = data.sumColumns[index];
        const addendDigits = data.partialRows.map(row => digitAt(row.alignedProduct, index));
        const workingValue = addendDigits.reduce((sum, digit) => sum + digit, expectedCarry);
        const carryOut = Math.floor(workingValue / 10);
        if (!column || column.placeIndex !== index
            || !Array.isArray(column.addendDigits) || column.addendDigits.length !== multiplierDigits
            || !column.addendDigits.every((digit: number, rowIndex: number) =>
                isDigit(digit) && digit === addendDigits[rowIndex])
            || !isSafeWhole(column.carryIn) || !isSafeWhole(column.workingValue)
            || !isDigit(column.resultDigit) || !isSafeWhole(column.carryOut)
            || column.carryIn !== expectedCarry || column.workingValue !== workingValue
            || column.resultDigit !== workingValue % 10 || column.carryOut !== carryOut) return false;
        reconstructed += column.resultDigit * 10 ** index;
        expectedCarry = carryOut;
    }
    return expectedCarry === 0 && reconstructed === data.product;
}

export function workColumnCount(data: StandardMultiplicationProblem): number {
    return Math.max(String(data.product).length,
        String(data.multiplicand).length + String(data.multiplier).length);
}

/** Positions an explicit partial row, including a zero multiplier and shift zeros. */
export function partialRowDigits(data: StandardMultiplicationProblem, rowIndex: number): readonly (number | null)[] {
    const row = data.partialRows[rowIndex]!;
    const width = workColumnCount(data);
    const unshiftedDigits = String(row.unshiftedProduct).length;
    return Array.from({length: width}, (_, leftIndex) => {
        const place = width - leftIndex - 1;
        if (place < row.shiftPlaces) return 0;
        const unshiftedPlace = place - row.shiftPlaces;
        return unshiftedPlace < unshiftedDigits ? digitAt(row.unshiftedProduct, unshiftedPlace) : null;
    });
}
