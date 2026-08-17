import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {
    IntegerRoundingProblem,
    LegacyIntegerRoundingProblem,
    MultiDigitIntegerRoundingProblem
} from '../../../../types/problems.ts';

const ROUNDING_PLACE_NAMES = new Map<
    MultiDigitIntegerRoundingProblem['roundingPlace'],
    MultiDigitIntegerRoundingProblem['roundingPlaceName']
>([
    [10, 'ten'],
    [100, 'hundred'],
    [1000, 'thousand'],
    [10000, 'ten-thousand'],
    [100000, 'hundred-thousand']
]);

const isSafeWholeNumber = (value: number): boolean =>
    Number.isSafeInteger(value) && value >= 0;

const hasCoherentRoundingValues = (data: IntegerRoundingProblem): boolean => {
    if (![
        data.number,
        data.roundingPlace,
        data.lowerMultiple,
        data.midpoint,
        data.upperMultiple,
        data.roundedValue,
        data.distanceLower,
        data.distanceUpper
    ].every(isSafeWholeNumber)) return false;

    const expectedDirection = data.number < data.midpoint ? 'down' : 'up';
    const expectedRoundedValue = expectedDirection === 'down'
        ? data.lowerMultiple
        : data.upperMultiple;

    return ROUNDING_PLACE_NAMES.has(data.roundingPlace)
        && data.lowerMultiple % data.roundingPlace === 0
        && data.upperMultiple === data.lowerMultiple + data.roundingPlace
        && data.midpoint === data.lowerMultiple + data.roundingPlace / 2
        && data.number > data.lowerMultiple
        && data.number < data.upperMultiple
        && data.distanceLower === data.number - data.lowerMultiple
        && data.distanceUpper === data.upperMultiple - data.number
        && data.direction === expectedDirection
        && data.roundedValue === expectedRoundedValue
        && data.isMidpointTie === (data.number === data.midpoint);
};

export const displayRoundingPlace = (
    name: MultiDigitIntegerRoundingProblem['roundingPlaceName']
): string => name.replaceAll('-', ' ');

export const getPointLabelX = (pointX: number, midpointX: number): number => {
    const minimumX = 94;
    const maximumX = 666;
    const midpointClearance = 82;
    const offset = Math.abs(pointX - midpointX) < midpointClearance
        ? (pointX < midpointX ? -midpointClearance : midpointClearance)
        : 0;
    return Math.min(maximumX, Math.max(minimumX, pointX + offset));
};

export type SourceScaleCue =
    | {kind: 'between'; lowerTick: number; upperTick: number}
    | {kind: 'exact-tick'; tick: number};

export const getSourceScaleCue = (
    number: number,
    lowerMultiple: number,
    roundingPlace: number
): SourceScaleCue => {
    const minorStep = roundingPlace / 10;
    const offset = number - lowerMultiple;
    if (offset % minorStep === 0) return {kind: 'exact-tick', tick: number};

    const lowerTick = lowerMultiple + Math.floor(offset / minorStep) * minorStep;
    return {
        kind: 'between',
        lowerTick,
        upperTick: lowerTick + minorStep
    };
};

export const isValidLegacyRoundingProblem = (
    data: IntegerRoundingProblem
): data is LegacyIntegerRoundingProblem =>
    !('task' in data)
    && (data.roundingPlace === 10 || data.roundingPlace === 100)
    && data.number <= 1000
    && data.upperMultiple <= 1000
    && hasCoherentRoundingValues(data);

export const isValidMultiDigitRoundingProblem = (
    data: IntegerRoundingProblem
): data is MultiDigitIntegerRoundingProblem => {
    if (!('task' in data) || data.task !== 'multi-digit-integer-rounding') return false;
    if (!hasCoherentRoundingValues(data)) return false;
    if (data.number < 1000 || data.number >= 1_000_000) return false;
    if (data.upperMultiple > 1_000_000) return false;

    const expectedPlaceName = ROUNDING_PLACE_NAMES.get(data.roundingPlace);
    if (!expectedPlaceName || data.roundingPlaceName !== expectedPlaceName) return false;

    const placeName = displayRoundingPlace(data.roundingPlaceName);
    const numberText = formatStandardNumeral(data.number);
    const lowerText = formatStandardNumeral(data.lowerMultiple);
    const upperText = formatStandardNumeral(data.upperMultiple);
    const roundedText = formatStandardNumeral(data.roundedValue);
    const distanceLowerText = formatStandardNumeral(data.distanceLower);
    const distanceUpperText = formatStandardNumeral(data.distanceUpper);
    const expectedExplanation = data.isMidpointTie
        ? `${numberText} is exactly halfway between ${lowerText} and ${upperText}, so it rounds up to ${upperText}.`
        : `${numberText} is ${distanceLowerText} from ${lowerText} and ${distanceUpperText} from ${upperText}, so it rounds ${data.direction} to ${roundedText}.`;

    return data.prompt === `Round ${numberText} to the nearest ${placeName}.`
        && data.questionEquation === `${numberText} → ?`
        && data.solutionEquation === `${numberText} → ${roundedText}`
        && data.roundingStatement
            === `${numberText} rounded to the nearest ${placeName} is ${roundedText}.`
        && data.decisionExplanation === expectedExplanation;
};
