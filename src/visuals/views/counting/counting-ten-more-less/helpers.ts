import {ViewValidationError} from '../../../helpers/validation.ts';
import {CountingIncDecProblem} from '../../../../types/problems.ts';

export interface PlaceValueParts {
    tens: number;
    ones: number;
}

export interface TenStepAnalysis {
    direction: 'inc' | 'dec';
    start: number;
    result: number;
    startParts: PlaceValueParts;
    resultParts: PlaceValueParts;
}

export type TenStepProblem = CountingIncDecProblem;

function isValidPlaceValue(number: number, parts: PlaceValueParts): boolean {
    return Number.isInteger(number)
        && number >= 0
        && number <= 100
        && Number.isInteger(parts.tens)
        && parts.tens >= 0
        && parts.tens <= 10
        && Number.isInteger(parts.ones)
        && parts.ones >= 0
        && parts.ones <= 9
        && parts.tens * 10 + parts.ones === number;
}

export function analyzeTenStepProblem(data: TenStepProblem): TenStepAnalysis {
    const {
        numObjects: start,
        incDecAnswer: result,
        incDecType: direction,
        simpleAnswer,
        stepSize,
        startPlaceValue: startParts,
        resultPlaceValue: resultParts
    } = data;

    if (simpleAnswer !== start || stepSize !== 10) {
        throw new ViewValidationError(
            'counting-ten-more-less',
            'Expected simpleAnswer to equal the start and stepSize to equal 10.'
        );
    }

    if (!isValidPlaceValue(start, startParts) || !isValidPlaceValue(result, resultParts)) {
        throw new ViewValidationError(
            'counting-ten-more-less',
            'Expected consistent place-value decompositions for values from 0 through 100.'
        );
    }

    const expectedResult = direction === 'inc'
        ? start + stepSize
        : direction === 'dec'
            ? start - stepSize
            : null;

    if (expectedResult === null || result !== expectedResult
        || resultParts.ones !== startParts.ones
        || Math.abs(resultParts.tens - startParts.tens) !== 1) {
        throw new ViewValidationError(
            'counting-ten-more-less',
            'Expected a ten-more or ten-less transition with an unchanged ones digit.'
        );
    }

    return {direction, start, result, startParts, resultParts};
}
