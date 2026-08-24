import {CountingIncDecProblem} from '../../../types/problems.ts';
import {ViewValidationError} from '../../helpers/validation.ts';

export type PlaceValueOffsetViewId =
    | 'counting-ten-more-less'
    | 'counting-hundred-more-less';

export type PlaceValueOffsetStep = 10 | 100;

export interface PlaceValueParts {
    hundreds?: number;
    tens: number;
    ones: number;
}

export interface PlaceValueStepAnalysis {
    direction: 'inc' | 'dec';
    start: number;
    result: number;
    stepSize: PlaceValueOffsetStep;
    startParts: PlaceValueParts;
    resultParts: PlaceValueParts;
}

function isValidPlaceValue(number: number, parts: PlaceValueParts): boolean {
    const usesHundreds = parts.hundreds !== undefined;
    const reconstructed = usesHundreds
        ? parts.hundreds! * 100 + parts.tens * 10 + parts.ones
        : parts.tens * 10 + parts.ones;

    return Number.isInteger(number)
        && number >= 0
        && number <= 1000
        && (usesHundreds || number <= 100)
        && (!usesHundreds || (Number.isInteger(parts.hundreds) && parts.hundreds! >= 0 && parts.hundreds! <= 10))
        && Number.isInteger(parts.tens)
        && parts.tens >= 0
        && parts.tens <= (usesHundreds ? 9 : 10)
        && Number.isInteger(parts.ones)
        && parts.ones >= 0
        && parts.ones <= 9
        && reconstructed === number;
}

export function analyzePlaceValueOffsetProblem(
    data: CountingIncDecProblem,
    expectedStepSize: PlaceValueOffsetStep,
    viewId: PlaceValueOffsetViewId
): PlaceValueStepAnalysis {
    const {
        numObjects: start,
        incDecAnswer: result,
        incDecType: direction,
        simpleAnswer,
        stepSize,
        startPlaceValue: startParts,
        resultPlaceValue: resultParts
    } = data;

    if (simpleAnswer !== start || stepSize !== expectedStepSize) {
        throw new ViewValidationError(
            viewId,
            `Expected simpleAnswer to equal the start and stepSize to equal ${expectedStepSize}.`
        );
    }

    if (!isValidPlaceValue(start, startParts) || !isValidPlaceValue(result, resultParts)) {
        throw new ViewValidationError(
            viewId,
            'Expected consistent place-value decompositions for values from 0 through 1000.'
        );
    }

    const expectedResult = direction === 'inc'
        ? start + stepSize
        : direction === 'dec'
            ? start - stepSize
            : null;
    const unchangedLowerPlaces = stepSize === 10
        ? resultParts.ones === startParts.ones
        : resultParts.ones === startParts.ones && resultParts.tens === startParts.tens;

    if (expectedResult === null || result !== expectedResult || !unchangedLowerPlaces) {
        throw new ViewValidationError(
            viewId,
            `Expected a ${stepSize}-more or ${stepSize}-less transition with unchanged lower places.`
        );
    }

    return {direction, start, result, stepSize, startParts, resultParts};
}
