import {ViewValidationError} from '../../helpers/validation.ts';

const MAX_PICTORIAL_COMPARISON_COUNT = 10;

export function validatePictorialComparisonCounts(viewId: string, num1: number, num2: number): void {
    for (const [field, value] of [['num1', num1], ['num2', num2]] as const) {
        if (!Number.isInteger(value) || value < 0 || value > MAX_PICTORIAL_COMPARISON_COUNT) {
            throw new ViewValidationError(
                viewId,
                `${field} must be an integer between 0 and ${MAX_PICTORIAL_COMPARISON_COUNT}; received ${value}.`
            );
        }
    }
}

export function validateWritingNumber(viewId: string, number: number): void {
    if (!Number.isInteger(number) || number < 0 || number > 120) {
        throw new ViewValidationError(
            viewId,
            `number must be an integer between 0 and 120; received ${number}.`
        );
    }
}
