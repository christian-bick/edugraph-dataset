import type {
    DecimalPlaceComparisonOperand,
    DecimalPlaceComparisonPlace,
    DecimalPlaceComparisonProblem
} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

export const COMPARISON_PLACES: readonly DecimalPlaceComparisonPlace[] = [
    'hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'
];

export function alignedComparisonDigits(operand: DecimalPlaceComparisonOperand): readonly number[] {
    return [...operand.wholeDigits, ...operand.fractionalDigits];
}

function validOperand(operand: DecimalPlaceComparisonOperand): boolean {
    if (
        !operand || !Number.isInteger(operand.wholePart) || operand.wholePart < 0 || operand.wholePart > 999 ||
        !Array.isArray(operand.wholeDigits) || operand.wholeDigits.length !== 3 ||
        !Array.isArray(operand.fractionalDigits) || operand.fractionalDigits.length !== 3 ||
        ![1, 2, 3].includes(operand.displayPrecision) ||
        !Number.isSafeInteger(operand.valueInThousandths) ||
        typeof operand.displayNumeral !== 'string'
    ) return false;

    const wholeDigits = operand.wholeDigits;
    const fractionalDigits = operand.fractionalDigits;
    if (
        [...wholeDigits, ...fractionalDigits].some(digit => !Number.isInteger(digit) || digit < 0 || digit > 9) ||
        wholeDigits[0] !== Math.floor(operand.wholePart / 100) ||
        wholeDigits[1] !== Math.floor(operand.wholePart / 10) % 10 ||
        wholeDigits[2] !== operand.wholePart % 10 ||
        fractionalDigits.slice(operand.displayPrecision).some(digit => digit !== 0)
    ) return false;

    return operand.displayNumeral === `${operand.wholePart}.${fractionalDigits.slice(0, operand.displayPrecision).join('')}` &&
        operand.valueInThousandths === operand.wholePart * 1000 +
            fractionalDigits[0] * 100 + fractionalDigits[1] * 10 + fractionalDigits[2];
}

export function assertDecimalPlaceComparison(viewId: string, data: DecimalPlaceComparisonProblem): void {
    if (data?.kind !== 'decimal-place-comparison' || data.base !== 10 || !validOperand(data.left) || !validOperand(data.right)) {
        throw new ViewValidationError(viewId, 'Expected two exact, aligned nonnegative decimal operands.');
    }
    const leftDigits = alignedComparisonDigits(data.left);
    const rightDigits = alignedComparisonDigits(data.right);
    const firstDifference = leftDigits.findIndex((digit, index) => digit !== rightDigits[index]);
    if (data.relation === 'equal') {
        if (
            data.left.valueInThousandths !== data.right.valueInThousandths ||
            firstDifference !== -1 || data.witness?.kind !== 'all-places-equal' ||
            !Array.isArray(data.witness.equalPlaces) ||
            data.witness.equalPlaces.length !== COMPARISON_PLACES.length ||
            data.witness.equalPlaces.some((place, index) => place !== COMPARISON_PLACES[index])
        ) throw new ViewValidationError(viewId, 'Equality must witness all six aligned places.');
        return;
    }
    if (data.relation !== 'greater' && data.relation !== 'less') {
        throw new ViewValidationError(viewId, 'Expected a greater, equal, or less relation.');
    }
    if (
        firstDifference < 0 || data.witness?.kind !== 'first-difference' ||
        data.witness.decidingPlace !== COMPARISON_PLACES[firstDifference] ||
        data.witness.leftDigit !== leftDigits[firstDifference] ||
        data.witness.rightDigit !== rightDigits[firstDifference] ||
        !Array.isArray(data.witness.higherEqualPlaces) ||
        data.witness.higherEqualPlaces.length !== firstDifference ||
        data.witness.higherEqualPlaces.some((place, index) => place !== COMPARISON_PLACES[index]) ||
        (data.relation === 'greater' ? data.left.valueInThousandths <= data.right.valueInThousandths
            : data.left.valueInThousandths >= data.right.valueInThousandths)
    ) throw new ViewValidationError(viewId, 'The first differing place must establish the exact relation.');
}

export function comparisonSymbol(relation: DecimalPlaceComparisonProblem['relation']): '>' | '=' | '<' {
    return relation === 'greater' ? '>' : relation === 'less' ? '<' : '=';
}
