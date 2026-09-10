import {formatStandardNumeral} from '../../lib/whole-number-notation.ts';
import {
    MeasurementConversionPair,
    MeasurementConversionPairId,
    MeasurementConversionUnitId,
    StandardUnitEquivalencesProblem
} from '../../types/problems.ts';

export type MeasurementUnitPresentation = {
    singular: string;
    plural: string;
    symbol: string;
};

const units: Record<MeasurementConversionUnitId, MeasurementUnitPresentation> = {
    kilometer: {singular: 'kilometer', plural: 'kilometers', symbol: 'km'},
    meter: {singular: 'meter', plural: 'meters', symbol: 'm'},
    centimeter: {singular: 'centimeter', plural: 'centimeters', symbol: 'cm'},
    kilogram: {singular: 'kilogram', plural: 'kilograms', symbol: 'kg'},
    gram: {singular: 'gram', plural: 'grams', symbol: 'g'},
    pound: {singular: 'pound', plural: 'pounds', symbol: 'lb'},
    ounce: {singular: 'ounce', plural: 'ounces', symbol: 'oz'},
    liter: {singular: 'liter', plural: 'liters', symbol: 'L'},
    milliliter: {singular: 'milliliter', plural: 'milliliters', symbol: 'mL'},
    hour: {singular: 'hour', plural: 'hours', symbol: 'hr'},
    minute: {singular: 'minute', plural: 'minutes', symbol: 'min'},
    second: {singular: 'second', plural: 'seconds', symbol: 'sec'}
};

const pairs: Record<MeasurementConversionPairId, MeasurementConversionPair> = {
    'kilometer-meter': {
        id: 'kilometer-meter',
        quantityKind: 'length',
        scalingKind: 'magnitude',
        largerUnit: 'kilometer',
        smallerUnit: 'meter',
        factor: 1000
    },
    'meter-centimeter': {
        id: 'meter-centimeter',
        quantityKind: 'length',
        scalingKind: 'magnitude',
        largerUnit: 'meter',
        smallerUnit: 'centimeter',
        factor: 100
    },
    'kilogram-gram': {
        id: 'kilogram-gram',
        quantityKind: 'weight',
        scalingKind: 'magnitude',
        largerUnit: 'kilogram',
        smallerUnit: 'gram',
        factor: 1000
    },
    'pound-ounce': {
        id: 'pound-ounce',
        quantityKind: 'weight',
        scalingKind: 'factor',
        largerUnit: 'pound',
        smallerUnit: 'ounce',
        factor: 16
    },
    'liter-milliliter': {
        id: 'liter-milliliter',
        quantityKind: 'liquid-volume',
        scalingKind: 'magnitude',
        largerUnit: 'liter',
        smallerUnit: 'milliliter',
        factor: 1000
    },
    'hour-minute': {
        id: 'hour-minute',
        quantityKind: 'time',
        scalingKind: 'factor',
        largerUnit: 'hour',
        smallerUnit: 'minute',
        factor: 60
    },
    'minute-second': {
        id: 'minute-second',
        quantityKind: 'time',
        scalingKind: 'factor',
        largerUnit: 'minute',
        smallerUnit: 'second',
        factor: 60
    }
};

export const isValidMeasurementConversionPair = (
    pair: MeasurementConversionPair
): boolean => {
    const expected = pair && pairs[pair.id];
    return Boolean(expected)
        && pair.quantityKind === expected.quantityKind
        && pair.scalingKind === expected.scalingKind
        && pair.largerUnit === expected.largerUnit
        && pair.smallerUnit === expected.smallerUnit
        && pair.factor === expected.factor;
};

export const getMeasurementUnitPresentation = (
    unitId: MeasurementConversionUnitId
): MeasurementUnitPresentation => units[unitId];

export const isValidStandardUnitEquivalences = (data: StandardUnitEquivalencesProblem): boolean => {
    if (!data || !isValidMeasurementConversionPair(data.pair)
        || !Array.isArray(data.equivalents) || data.equivalents.length !== 5) return false;
    return data.equivalents.every((equivalent, index) => Boolean(equivalent)
        && Number.isSafeInteger(equivalent.largerValue) && equivalent.largerValue > 0
        && Number.isSafeInteger(equivalent.smallerValue) && equivalent.smallerValue > 0
        && equivalent.smallerValue === equivalent.largerValue * data.pair.factor
        && (index === 0
            ? equivalent.largerValue >= 2 && equivalent.largerValue <= 9
            : equivalent.largerValue === data.equivalents[index - 1]!.largerValue + 1));
};

export const getQuantityName = (
    quantityKind: MeasurementConversionPair['quantityKind']
): string => quantityKind === 'liquid-volume' ? 'liquid volume' : quantityKind;

export const formatMeasurement = (
    value: number,
    unitId: MeasurementConversionUnitId
): string => {
    const unit = getMeasurementUnitPresentation(unitId);
    return `${formatStandardNumeral(value)} ${value === 1 ? unit.singular : unit.plural}`;
};

export const formatMeasurementEquation = (
    largerValue: number,
    smallerValue: number,
    pair: MeasurementConversionPair
): string => `${formatMeasurement(largerValue, pair.largerUnit)} = ${formatMeasurement(smallerValue, pair.smallerUnit)}`;

export const formatUnitEquivalence = (pair: MeasurementConversionPair): string => {
    const larger = getMeasurementUnitPresentation(pair.largerUnit);
    const smaller = getMeasurementUnitPresentation(pair.smallerUnit);
    return `1 ${larger.singular} = ${formatStandardNumeral(pair.factor)} ${smaller.plural}`;
};

export const formatFactorInstruction = (pair: MeasurementConversionPair): string => {
    const larger = getMeasurementUnitPresentation(pair.largerUnit);
    const smaller = getMeasurementUnitPresentation(pair.smallerUnit);
    return `Multiply a number of ${larger.plural} by ${formatStandardNumeral(pair.factor)} to find the equivalent number of ${smaller.plural}.`;
};

export const formatRelativeSizeStatement = (pair: MeasurementConversionPair): string => {
    const larger = getMeasurementUnitPresentation(pair.largerUnit);
    const smaller = getMeasurementUnitPresentation(pair.smallerUnit);
    const factor = formatStandardNumeral(pair.factor);
    if (pair.quantityKind === 'length') {
        return `One ${larger.singular} is ${factor} times as long as one ${smaller.singular}.`;
    }
    if (pair.quantityKind === 'weight') {
        return `One ${larger.singular} is ${factor} times as heavy as one ${smaller.singular}.`;
    }
    if (pair.quantityKind === 'liquid-volume') {
        return `One ${larger.singular} holds ${factor} times as much liquid volume as one ${smaller.singular}.`;
    }
    return `One ${larger.singular} lasts ${factor} times as long as one ${smaller.singular}.`;
};

export const capitalize = (value: string): string =>
    value.charAt(0).toUpperCase() + value.slice(1);
