import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {
    GenericUnitScaleRelationProblem,
    LargerToSmallerConversionProblem,
    MeasurementConversionPair,
    MeasurementConversionPairId,
    MeasurementConversionProblem,
    MeasurementConversionUnit,
    RelativeUnitSizeProblem
} from '../../../../types/problems.ts';

type PairDefinition = Pick<
    MeasurementConversionPair,
    'quantityKind' | 'scalingKind' | 'largerUnit' | 'smallerUnit' | 'factor' | 'relativeSizeStatement'
>;

const unit = (
    id: MeasurementConversionUnit['id'],
    singular: string,
    plural: string,
    symbol: string
): MeasurementConversionUnit => ({id, singular, plural, symbol});

const PAIRS: Record<MeasurementConversionPairId, PairDefinition> = {
    'kilometer-meter': {
        quantityKind: 'length',
        scalingKind: 'magnitude',
        largerUnit: unit('kilometer', 'kilometer', 'kilometers', 'km'),
        smallerUnit: unit('meter', 'meter', 'meters', 'm'),
        factor: 1000,
        relativeSizeStatement: 'One kilometer is 1,000 times as long as one meter.'
    },
    'meter-centimeter': {
        quantityKind: 'length',
        scalingKind: 'magnitude',
        largerUnit: unit('meter', 'meter', 'meters', 'm'),
        smallerUnit: unit('centimeter', 'centimeter', 'centimeters', 'cm'),
        factor: 100,
        relativeSizeStatement: 'One meter is 100 times as long as one centimeter.'
    },
    'kilogram-gram': {
        quantityKind: 'weight',
        scalingKind: 'magnitude',
        largerUnit: unit('kilogram', 'kilogram', 'kilograms', 'kg'),
        smallerUnit: unit('gram', 'gram', 'grams', 'g'),
        factor: 1000,
        relativeSizeStatement: 'One kilogram is 1,000 times as heavy as one gram.'
    },
    'pound-ounce': {
        quantityKind: 'weight',
        scalingKind: 'factor',
        largerUnit: unit('pound', 'pound', 'pounds', 'lb'),
        smallerUnit: unit('ounce', 'ounce', 'ounces', 'oz'),
        factor: 16,
        relativeSizeStatement: 'One pound is 16 times as heavy as one ounce.'
    },
    'liter-milliliter': {
        quantityKind: 'liquid-volume',
        scalingKind: 'magnitude',
        largerUnit: unit('liter', 'liter', 'liters', 'L'),
        smallerUnit: unit('milliliter', 'milliliter', 'milliliters', 'mL'),
        factor: 1000,
        relativeSizeStatement: 'One liter holds 1,000 times as much liquid volume as one milliliter.'
    },
    'hour-minute': {
        quantityKind: 'time',
        scalingKind: 'factor',
        largerUnit: unit('hour', 'hour', 'hours', 'hr'),
        smallerUnit: unit('minute', 'minute', 'minutes', 'min'),
        factor: 60,
        relativeSizeStatement: 'One hour lasts 60 times as long as one minute.'
    },
    'minute-second': {
        quantityKind: 'time',
        scalingKind: 'factor',
        largerUnit: unit('minute', 'minute', 'minutes', 'min'),
        smallerUnit: unit('second', 'second', 'seconds', 'sec'),
        factor: 60,
        relativeSizeStatement: 'One minute lasts 60 times as long as one second.'
    }
};

const sameUnit = (
    actual: MeasurementConversionUnit | null | undefined,
    expected: MeasurementConversionUnit
): boolean => {
    if (!actual) return false;
    return actual.id === expected.id
        && actual.singular === expected.singular
        && actual.plural === expected.plural
        && actual.symbol === expected.symbol;
};

const formatMeasure = (value: number, measurementUnit: MeasurementConversionUnit): string =>
    `${formatStandardNumeral(value)} ${value === 1 ? measurementUnit.singular : measurementUnit.plural}`;

const isValidPair = (pair: MeasurementConversionPair): boolean => {
    const expected = PAIRS[pair.id];
    if (!expected
        || pair.quantityKind !== expected.quantityKind
        || pair.scalingKind !== expected.scalingKind
        || !sameUnit(pair.largerUnit, expected.largerUnit)
        || !sameUnit(pair.smallerUnit, expected.smallerUnit)
        || pair.factor !== expected.factor
        || pair.relativeSizeStatement !== expected.relativeSizeStatement) return false;

    const factorText = formatStandardNumeral(pair.factor);
    return pair.equivalenceEquation
            === `1 ${pair.largerUnit.singular} = ${factorText} ${pair.smallerUnit.plural}`
        && pair.factorStatement
            === `Multiply a number of ${pair.largerUnit.plural} by ${factorText} to find the equivalent number of ${pair.smallerUnit.plural}.`;
};

export const isSupportedMeasureConversionProblem = (
    data: MeasurementConversionProblem
): data is GenericUnitScaleRelationProblem | RelativeUnitSizeProblem | LargerToSmallerConversionProblem =>
    data.task === 'generic-unit-scale'
    || data.task === 'relative-unit-size'
    || data.task === 'convert-larger-to-smaller';

const isValidGenericUnitScale = (data: GenericUnitScaleRelationProblem): boolean => {
    if (!Number.isSafeInteger(data.largeUnitCount)
        || data.largeUnitCount < 3
        || data.largeUnitCount > 6
        || !Number.isSafeInteger(data.unitsPerLarge)
        || data.unitsPerLarge < 2
        || data.unitsPerLarge > 3
        || !Number.isSafeInteger(data.smallUnitCount)
        || data.smallUnitCount !== data.largeUnitCount * data.unitsPerLarge) return false;

    const largeText = formatStandardNumeral(data.largeUnitCount);
    const smallText = formatStandardNumeral(data.smallUnitCount);
    const factorText = formatStandardNumeral(data.unitsPerLarge);
    const solutionEquation = `${largeText} × ${factorText} = ${smallText}`;
    return data.prompt
            === 'The same length is measured with large units and small units. Which unit size needs more units?'
        && data.equivalentLengthStatement
            === `The same length is ${largeText} large units or ${smallText} small units.`
        && data.questionEquation === `${largeText} × ${factorText} = ?`
        && data.solutionEquation === solutionEquation
        && data.answerStatement
            === `Smaller units need a larger count: ${smallText} > ${largeText}.`
        && data.explanation
            === `Each large unit covers the same length as ${factorText} small units, so ${solutionEquation}.`;
};

const isValidRelativeUnitSize = (data: RelativeUnitSizeProblem): boolean => {
    if (!Number.isSafeInteger(data.exampleLargerValue)
        || data.exampleLargerValue < 2
        || data.exampleLargerValue > 9
        || !Number.isSafeInteger(data.exampleSmallerValue)
        || data.exampleSmallerValue !== data.exampleLargerValue * data.pair.factor
        || data.answer !== data.pair.factor) return false;

    const quantity = data.pair.quantityKind === 'liquid-volume'
        ? 'liquid volume'
        : data.pair.quantityKind;
    const exampleEquation = `${formatMeasure(data.exampleLargerValue, data.pair.largerUnit)} = ${formatMeasure(data.exampleSmallerValue, data.pair.smallerUnit)}`;
    return data.exampleEquation === exampleEquation
        && data.prompt
            === `Use the equivalent ${quantity} to determine how many ${data.pair.smallerUnit.plural} equal 1 ${data.pair.largerUnit.singular}.`
        && data.questionEquation
            === `1 ${data.pair.largerUnit.singular} = ? ${data.pair.smallerUnit.plural}`
        && data.solutionEquation === data.pair.equivalenceEquation
        && data.comparisonStatement
            === `${exampleEquation} names the same ${quantity} with a smaller count of ${data.pair.largerUnit.plural} and a larger count of ${data.pair.smallerUnit.plural}.`
        && data.explanation
            === `${exampleEquation} represents the same ${quantity}. Dividing both counts by ${formatStandardNumeral(data.exampleLargerValue)} gives ${data.pair.equivalenceEquation}. ${data.pair.relativeSizeStatement}`;
};

const isValidLargerToSmaller = (data: LargerToSmallerConversionProblem): boolean => {
    if (!Number.isSafeInteger(data.sourceValue)
        || data.sourceValue < 2
        || data.sourceValue > 9
        || !Number.isSafeInteger(data.convertedValue)
        || data.convertedValue !== data.sourceValue * data.pair.factor
        || data.answer !== data.convertedValue) return false;

    const source = formatMeasure(data.sourceValue, data.pair.largerUnit);
    const converted = formatMeasure(data.convertedValue, data.pair.smallerUnit);
    const sourceText = formatStandardNumeral(data.sourceValue);
    const factorText = formatStandardNumeral(data.pair.factor);
    const convertedText = formatStandardNumeral(data.convertedValue);
    const solutionEquation = `${sourceText} × ${factorText} = ${convertedText}`;
    const measurementEquation = `${source} = ${converted}`;
    return data.prompt === `Convert ${source} to ${data.pair.smallerUnit.plural}.`
        && data.questionEquation === `${sourceText} × ${factorText} = ?`
        && data.solutionEquation === solutionEquation
        && data.measurementEquation === measurementEquation
        && data.answerStatement === `${source} is equivalent to ${converted}.`
        && data.explanation
            === `Since ${data.pair.equivalenceEquation}, multiply ${sourceText} by ${factorText}. ${solutionEquation}, so ${measurementEquation}.`;
};

export const isValidMeasureConversionProblem = (
    data: GenericUnitScaleRelationProblem | RelativeUnitSizeProblem | LargerToSmallerConversionProblem
): boolean => data.task === 'generic-unit-scale'
    ? isValidGenericUnitScale(data)
    : isValidPair(data.pair)
    && (data.task === 'relative-unit-size'
        ? isValidRelativeUnitSize(data)
        : isValidLargerToSmaller(data));
