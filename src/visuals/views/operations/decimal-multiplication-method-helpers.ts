import type {
    DecimalMultiplicationOperand,
    DecimalMultiplicationPlace,
    DecimalMultiplicationProblem
} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

const PLACES: readonly DecimalMultiplicationPlace[] = ['ones', 'tenths', 'hundredths'];
const PLACE_UNITS = {ones: 100, tenths: 10, hundredths: 1} as const;

export function scaledNumeral(value: number, scale: 100 | 10000): string {
    const width = scale === 100 ? 2 : 4;
    const whole = Math.floor(value / scale);
    const fractional = String(value % scale).padStart(width, '0').replace(/0+$/, '');
    return fractional ? `${whole}.${fractional}` : String(whole);
}

export function fourPlaceNumeral(valueInTenThousandths: number): string {
    const whole = Math.floor(valueInTenThousandths / 10000);
    return `${whole}.${String(valueInTenThousandths % 10000).padStart(4, '0')}`;
}

function validOperand(operand: DecimalMultiplicationOperand): boolean {
    if (!operand || !Number.isInteger(operand.valueInHundredths) ||
        operand.valueInHundredths < 0 || operand.valueInHundredths > 999 ||
        !Array.isArray(operand.alignedDigits) || operand.alignedDigits.length !== 3 ||
        operand.alignedDigits.some(digit => !Number.isInteger(digit) || digit < 0 || digit > 9) ||
        !Array.isArray(operand.partitions) ||
        operand.canonicalNumeral !== scaledNumeral(operand.valueInHundredths, 100)) return false;
    const [ones, tenths, hundredths] = operand.alignedDigits;
    if (operand.valueInHundredths !== ones * 100 + tenths * 10 + hundredths) return false;
    const nonzeroDigits = operand.alignedDigits.map((digit, index) => ({digit, place: PLACES[index]}))
        .filter(({digit}) => digit !== 0);
    if (operand.partitions.length !== nonzeroDigits.length) return false;
    let start = 0;
    for (let index = 0; index < nonzeroDigits.length; index++) {
        const part = operand.partitions[index];
        const expected = nonzeroDigits[index];
        const value = expected.digit * PLACE_UNITS[expected.place];
        if (!part || part.place !== expected.place || part.digit !== expected.digit ||
            part.valueInHundredths !== value || part.startInHundredths !== start) return false;
        start += value;
    }
    return start === operand.valueInHundredths;
}

export function assertDecimalMultiplication(viewId: string, data: DecimalMultiplicationProblem): void {
    if (data?.kind !== 'decimal-multiplication-model' || data.base !== 10 ||
        data.operandScale !== 100 || data.productScale !== 10000 ||
        !validOperand(data.first) || !validOperand(data.second)) {
        throw new ViewValidationError(viewId, 'Expected exact decimal factors with ordered place partitions.');
    }
    const grid = data.areaGrid;
    const product = data.first.valueInHundredths * data.second.valueInHundredths;
    if (!data.product || !Number.isSafeInteger(data.product.valueInTenThousandths) ||
        data.product.valueInTenThousandths !== product ||
        data.product.canonicalNumeral !== scaledNumeral(product, 10000) ||
        !grid || grid.widthInHundredths !== data.first.valueInHundredths ||
        grid.heightInHundredths !== data.second.valueInHundredths ||
        grid.widthInHundredths > 120 || grid.heightInHundredths > 12 ||
        grid.cellAreaInTenThousandths !== 1 || grid.cellCount !== product ||
        !Array.isArray(grid.regions) ||
        grid.regions.length !== data.first.partitions.length * data.second.partitions.length) {
        throw new ViewValidationError(viewId, 'The bounded hundredth-by-hundredth grid must equal the exact product.');
    }
    let index = 0;
    let sum = 0;
    for (let firstIndex = 0; firstIndex < data.first.partitions.length; firstIndex++) {
        const firstPart = data.first.partitions[firstIndex];
        for (let secondIndex = 0; secondIndex < data.second.partitions.length; secondIndex++) {
            const secondPart = data.second.partitions[secondIndex];
            const region = grid.regions[index++];
            const cellCount = firstPart.valueInHundredths * secondPart.valueInHundredths;
            if (!region || region.firstPartitionIndex !== firstIndex ||
                region.secondPartitionIndex !== secondIndex ||
                region.columnStart !== firstPart.startInHundredths ||
                region.rowStart !== secondPart.startInHundredths ||
                region.columns !== firstPart.valueInHundredths ||
                region.rows !== secondPart.valueInHundredths ||
                region.cellCount !== cellCount ||
                region.productInTenThousandths !== cellCount) {
                throw new ViewValidationError(viewId, 'The place-pair regions must tile the grid without gaps or overlaps.');
            }
            sum += region.cellCount;
        }
    }
    if (sum !== grid.cellCount) {
        throw new ViewValidationError(viewId, 'The partial products must total the whole grid.');
    }
}
