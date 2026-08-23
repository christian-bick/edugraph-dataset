import {PlaceValueName, PlaceValueScalingProblem} from '../../../../types/problems.ts';

export const PLACE_NAMES: readonly PlaceValueName[] = [
    'hundred-thousands',
    'ten-thousands',
    'thousands',
    'hundreds',
    'tens',
    'ones'
];

function isValidPlace(
    place: PlaceValueScalingProblem['leftPlace'],
    digit: number,
    digitIndex: number
) {
    const exponent = 5 - digitIndex;
    return Number.isInteger(place.digitIndex)
        && place.digitIndex === digitIndex
        && place.name === PLACE_NAMES[digitIndex]
        && place.exponent === exponent
        && place.value === digit * (10 ** exponent);
}

export function isValidPlaceValueScalingProblem(data: PlaceValueScalingProblem): boolean {
    if (data.task !== 'adjacent-place-scaling'
        || !Number.isSafeInteger(data.number)
        || data.number < 100000
        || data.number > 999999
        || !Array.isArray(data.digits)
        || data.digits.length !== 6
        || data.digits.some(digit => !Number.isInteger(digit) || digit < 0 || digit > 9)
        || data.digits[0] === 0
        || Number(data.digits.join('')) !== data.number
        || !Number.isInteger(data.repeatedDigit)
        || data.repeatedDigit < 1
        || data.repeatedDigit > 9
        || data.digits.filter(digit => digit === data.repeatedDigit).length !== 2
        || typeof data.leftPlace !== 'object'
        || data.leftPlace === null
        || typeof data.rightPlace !== 'object'
        || data.rightPlace === null
        || data.rightPlace.digitIndex !== data.leftPlace.digitIndex + 1
        || data.leftPlace.exponent !== data.rightPlace.exponent + 1
        || data.digits[data.leftPlace.digitIndex] !== data.repeatedDigit
        || data.digits[data.rightPlace.digitIndex] !== data.repeatedDigit
        || !isValidPlace(data.leftPlace, data.repeatedDigit, data.leftPlace.digitIndex)
        || !isValidPlace(data.rightPlace, data.repeatedDigit, data.rightPlace.digitIndex)
        || data.scaleFactor !== 10
        || data.leftPlace.value !== data.rightPlace.value * data.scaleFactor) {
        return false;
    }

    return true;
}

export function placeValueScalingPresentation(data: PlaceValueScalingProblem) {
    const leftName = displayPlaceName(data.leftPlace.name).toLowerCase();
    const rightName = displayPlaceName(data.rightPlace.name).toLowerCase();
    return {
        prompt: `The ${data.repeatedDigit} in the ${rightName} place represents ${data.rightPlace.value}. What value does the same digit represent in the adjacent ${leftName} place?`,
        questionMultiplicationEquation: `${data.rightPlace.value} × ${data.scaleFactor} = ?`,
        questionDivisionEquation: `? ÷ ${data.scaleFactor} = ${data.rightPlace.value}`,
        multiplicationEquation: `${data.rightPlace.value} × ${data.scaleFactor} = ${data.leftPlace.value}`,
        divisionEquation: `${data.leftPlace.value} ÷ ${data.scaleFactor} = ${data.rightPlace.value}`,
        comparisonStatement: `The ${data.repeatedDigit} in the ${leftName} place represents ${data.scaleFactor} times as much as the ${data.repeatedDigit} in the ${rightName} place.`
    };
}

export function displayPlaceName(name: PlaceValueName): string {
    return name
        .split('-')
        .map(word => `${word[0].toUpperCase()}${word.slice(1)}`)
        .join(' ');
}
