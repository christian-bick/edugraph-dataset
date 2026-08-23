import {
    GenericUnitScaleRelationProblem,
    LargerToSmallerConversionProblem,
    MeasurementConversionProblem,
    RelativeUnitSizeProblem
} from '../../../types/problems.ts';
import {isValidMeasurementConversionPair} from '../../helpers/measurement-conversion.ts';

const isPositiveSafeInteger = (value: unknown): value is number =>
    Number.isSafeInteger(value) && (value as number) > 0;

export const isSupportedMeasureConversionProblem = (
    data: MeasurementConversionProblem
): data is GenericUnitScaleRelationProblem | RelativeUnitSizeProblem | LargerToSmallerConversionProblem =>
    data.task === 'generic-unit-scale'
    || data.task === 'relative-unit-size'
    || data.task === 'convert-larger-to-smaller';

export const isValidMeasureConversionProblem = (
    data: GenericUnitScaleRelationProblem | RelativeUnitSizeProblem | LargerToSmallerConversionProblem
): boolean => {
    if (data.task === 'generic-unit-scale') {
        return Number.isSafeInteger(data.largeUnitCount)
            && data.largeUnitCount >= 3
            && data.largeUnitCount <= 6
            && Number.isSafeInteger(data.unitsPerLarge)
            && data.unitsPerLarge >= 2
            && data.unitsPerLarge <= 3
            && Number.isSafeInteger(data.smallUnitCount)
            && data.smallUnitCount === data.largeUnitCount * data.unitsPerLarge;
    }

    if (!isValidMeasurementConversionPair(data.pair)) return false;
    if (data.task === 'relative-unit-size') {
        return isPositiveSafeInteger(data.exampleLargerValue)
            && data.exampleLargerValue >= 2
            && data.exampleLargerValue <= 9
            && isPositiveSafeInteger(data.exampleSmallerValue)
            && data.exampleSmallerValue === data.exampleLargerValue * data.pair.factor;
    }

    return isPositiveSafeInteger(data.sourceValue)
        && data.sourceValue >= 2
        && data.sourceValue <= 9
        && isPositiveSafeInteger(data.convertedValue)
        && data.convertedValue === data.sourceValue * data.pair.factor;
};
