import {formatStandardNumeral} from '../../../lib/whole-number-notation.ts';
import {
    GenericUnitScaleRelationProblem,
    MeasurementConversionUnitId,
    MeasurementConversionValuesProblem
} from '../../../types/problems.ts';
import {
    getMeasurementUnitPresentation,
    isValidMeasurementConversionPair
} from '../../helpers/measurement-conversion.ts';

const MAX_DISPLAY_HUNDREDTHS = 1_000_000;

export const formatConversionHundredths = (hundredths: number): string => {
    if (!Number.isSafeInteger(hundredths) || hundredths < 0 || hundredths > MAX_DISPLAY_HUNDREDTHS) {
        throw new RangeError('Conversion hundredths are outside the supported display range.');
    }
    const whole = formatStandardNumeral(Math.floor(hundredths / 100));
    const fraction = hundredths % 100;
    return fraction === 0
        ? whole
        : `${whole}.${String(fraction).padStart(2, '0').replace(/0$/, '')}`;
};

export const formatConversionMeasurement = (
    hundredths: number,
    unitId: MeasurementConversionUnitId
): string => {
    const unit = getMeasurementUnitPresentation(unitId);
    return `${formatConversionHundredths(hundredths)} ${hundredths === 100 ? unit.singular : unit.plural}`;
};

export const isValidMeasurementConversionValues = (data: MeasurementConversionValuesProblem): boolean => {
    if (!data || !isValidMeasurementConversionPair(data.pair)) return false;
    const examples = data.numericExamples;
    if (!examples || (examples.numberKind !== 'integer' && examples.numberKind !== 'decimal')
        || !Array.isArray(examples.equalities) || examples.equalities.length !== 2) return false;
    const [first, second] = examples.equalities;
    if (!first || !second || first.largerHundredths === second.largerHundredths) return false;

    return examples.equalities.every(equality => {
        if (!Number.isSafeInteger(equality.largerHundredths)
            || !Number.isSafeInteger(equality.smallerHundredths)
            || equality.largerHundredths <= 0
            || equality.smallerHundredths <= 0
            || equality.largerHundredths > MAX_DISPLAY_HUNDREDTHS
            || equality.smallerHundredths > MAX_DISPLAY_HUNDREDTHS
            || equality.smallerHundredths !== equality.largerHundredths * data.pair.factor) return false;
        return examples.numberKind === 'integer'
            ? equality.largerHundredths % 100 === 0 && equality.smallerHundredths % 100 === 0
            : equality.largerHundredths % 100 !== 0;
    });
};

export const isValidGenericUnitScaleRelation = (data: GenericUnitScaleRelationProblem): boolean => Boolean(data)
    && Number.isSafeInteger(data.largeUnitCount)
    && data.largeUnitCount >= 3
    && data.largeUnitCount <= 6
    && Number.isSafeInteger(data.unitsPerLarge)
    && data.unitsPerLarge >= 2
    && data.unitsPerLarge <= 3
    && Number.isSafeInteger(data.smallUnitCount)
    && data.smallUnitCount === data.largeUnitCount * data.unitsPerLarge;
