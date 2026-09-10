import {MeasurementConversionProblem} from '../../../types/problems.ts';
import {isValidStandardUnitEquivalences} from '../../helpers/measurement-conversion.ts';

export const isValidMeasureConversionProblem = (
    data: MeasurementConversionProblem
): boolean => {
    if (!data) return false;
    if (!('pair' in data)) {
        return Number.isSafeInteger(data.largeUnitCount)
            && data.largeUnitCount >= 3
            && data.largeUnitCount <= 6
            && Number.isSafeInteger(data.unitsPerLarge)
            && data.unitsPerLarge >= 2
            && data.unitsPerLarge <= 3
            && Number.isSafeInteger(data.smallUnitCount)
            && data.smallUnitCount === data.largeUnitCount * data.unitsPerLarge;
    }

    return isValidStandardUnitEquivalences(data);
};
