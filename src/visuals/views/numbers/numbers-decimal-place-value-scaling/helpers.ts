import type {
    DecimalAdjacentPlaceScalingProblem,
    DecimalScalingPlace,
    DecimalScalingPlaceName
} from '../../../../types/problems.ts';

export const PLACE_NAMES: readonly DecimalScalingPlaceName[] = [
    'hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'
];

export const UNITS_IN_THOUSANDTHS = [100000, 10000, 1000, 100, 10, 1] as const;

/** Formats an exact integer count of thousandths without floating-point arithmetic. */
export function formatThousandths(value: number): string {
    const whole = Math.floor(value / 1000);
    const fraction = String(value % 1000).padStart(3, '0').replace(/0+$/, '');
    return fraction ? `${whole}.${fraction}` : String(whole);
}

export function displayNumeral(data: DecimalAdjacentPlaceScalingProblem): string {
    const whole = data.digits[0] * 100 + data.digits[1] * 10 + data.digits[2];
    return `${whole}.${data.digits.slice(3).join('')}`;
}

function validPlace(
    place: DecimalScalingPlace,
    digit: number,
    digits: DecimalAdjacentPlaceScalingProblem['digits']
): boolean {
    if (!place || typeof place !== 'object' || !Number.isInteger(place.digitIndex)) return false;
    const index = place.digitIndex;
    return index >= 0 && index < 6
        && place.name === PLACE_NAMES[index]
        && place.exponent === 2 - index
        && place.unitInThousandths === UNITS_IN_THOUSANDTHS[index]
        && digits[index] === digit
        && place.digitValueInThousandths === digit * place.unitInThousandths;
}

/** Verifies every displayed digit, exact contribution, adjacent place, and inverse ratio. */
export function validDecimalPlaceScaling(data: DecimalAdjacentPlaceScalingProblem): boolean {
    if (data.kind !== 'decimal-adjacent-place-scaling'
        || !Array.isArray(data.digits)
        || data.digits.length !== 6
        || data.digits.some(digit => !Number.isInteger(digit) || digit < 0 || digit > 9)
        || !Number.isSafeInteger(data.numberInThousandths)
        || data.numberInThousandths < 0
        || data.numberInThousandths !== data.digits.reduce(
            (sum, digit, index) => sum + digit * UNITS_IN_THOUSANDTHS[index]!, 0)
        || !Number.isInteger(data.repeatedDigit)
        || data.repeatedDigit < 1 || data.repeatedDigit > 9
        || !validPlace(data.higherPlace, data.repeatedDigit, data.digits)
        || !validPlace(data.lowerPlace, data.repeatedDigit, data.digits)
        || data.lowerPlace.digitIndex !== data.higherPlace.digitIndex + 1
        || !data.scale || data.scale.factor !== 10
        || data.scale.reciprocalNumerator !== 1
        || data.scale.reciprocalDenominator !== 10
        || data.higherPlace.digitValueInThousandths !== data.lowerPlace.digitValueInThousandths * 10) {
        return false;
    }
    return true;
}
