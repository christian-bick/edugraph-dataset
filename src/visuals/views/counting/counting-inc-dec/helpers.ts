import type {CountingIncDecProblem} from '../../../../types/problems.ts';
import {ViewValidationError} from '../../../helpers/validation.ts';

const MAX_LOOSE_OBJECTS = 20;

function isValidPlaceValue(value: number, placeValue: {tens: number; ones: number}): boolean {
    return Number.isInteger(placeValue.tens)
        && placeValue.tens >= 0
        && Number.isInteger(placeValue.ones)
        && placeValue.ones >= 0
        && placeValue.ones <= 9
        && placeValue.tens * 10 + placeValue.ones === value;
}

export function validateCountingIncDecProblem(data: CountingIncDecProblem): void {
    const valuesAreSupported = Number.isInteger(data.numObjects)
        && Number.isInteger(data.incDecAnswer)
        && data.numObjects >= 1
        && data.numObjects <= MAX_LOOSE_OBJECTS
        && data.incDecAnswer >= 1
        && data.incDecAnswer <= MAX_LOOSE_OBJECTS;
    const directionIsSupported = data.incDecType === 'inc' || data.incDecType === 'dec';
    const stepIsSupported = data.stepSize === 1 || data.stepSize === 10;
    const expectedAnswer = data.incDecType === 'inc'
        ? data.numObjects + data.stepSize
        : data.numObjects - data.stepSize;

    if (!valuesAreSupported
        || !directionIsSupported
        || !stepIsSupported
        || data.simpleAnswer !== data.numObjects
        || data.incDecAnswer !== expectedAnswer
        || !isValidPlaceValue(data.numObjects, data.startPlaceValue)
        || !isValidPlaceValue(data.incDecAnswer, data.resultPlaceValue)) {
        throw new ViewValidationError(
            'counting-inc-dec',
            'Expected a consistent ±1 or ±10 counting change using loose-object quantities from 1 through 20.'
        );
    }
}
