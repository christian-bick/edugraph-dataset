import {ViewValidationError} from '../../../helpers/validation.ts';
import {CountingIncDecProblem} from '../../../../types/problems.ts';

export interface PlaceValueParts {
    hundreds?: number;
    tens: number;
    ones: number;
}

export interface PlaceValueStepAnalysis {
    direction: 'inc' | 'dec';
    start: number;
    result: number;
    stepSize: 10 | 100;
    startParts: PlaceValueParts;
    resultParts: PlaceValueParts;
}

export type TenStepProblem = CountingIncDecProblem;

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

export function analyzeTenStepProblem(data: TenStepProblem): PlaceValueStepAnalysis {
    const {
        numObjects: start,
        incDecAnswer: result,
        incDecType: direction,
        simpleAnswer,
        stepSize,
        startPlaceValue: startParts,
        resultPlaceValue: resultParts
    } = data;

    if (simpleAnswer !== start || (stepSize !== 10 && stepSize !== 100)) {
        throw new ViewValidationError(
            'counting-ten-more-less',
            'Expected simpleAnswer to equal the start and stepSize to equal 10 or 100.'
        );
    }

    if (!isValidPlaceValue(start, startParts) || !isValidPlaceValue(result, resultParts)) {
        throw new ViewValidationError(
            'counting-ten-more-less',
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
            'counting-ten-more-less',
            `Expected a ${stepSize}-more or ${stepSize}-less transition with unchanged lower places.`
        );
    }

    return {direction, start, result, stepSize, startParts, resultParts};
}
