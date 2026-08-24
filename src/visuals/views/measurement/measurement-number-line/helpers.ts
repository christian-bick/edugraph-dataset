import {
    MeasurementNumberLineKind,
    MeasurementNumberLineProblem,
    MeasurementNumberLineUnitId,
    MeasurementNumberLineValue
} from '../../../../types/problems.ts';

export type MeasurementNumberLineUnitPresentation = {
    singular: string;
    plural: string;
    symbol: string;
};

const UNITS: Record<MeasurementNumberLineUnitId, MeasurementNumberLineUnitPresentation> = {
    meter: {singular: 'meter', plural: 'meters', symbol: 'm'},
    hour: {singular: 'hour', plural: 'hours', symbol: 'h'},
    liter: {singular: 'liter', plural: 'liters', symbol: 'L'},
    kilogram: {singular: 'kilogram', plural: 'kilograms', symbol: 'kg'},
    dollar: {singular: 'dollar', plural: 'dollars', symbol: '$'}
};

const UNIT_IDS: Record<MeasurementNumberLineKind, MeasurementNumberLineUnitId> = {
    length: 'meter',
    time: 'hour',
    'liquid-volume': 'liter',
    weight: 'kilogram',
    money: 'dollar'
};

const gcd = (left: number, right: number): number => {
    let a = Math.abs(left);
    let b = Math.abs(right);
    while (b !== 0) {
        const remainder = a % b;
        a = b;
        b = remainder;
    }
    return a;
};

const isValidValue = (
    value: MeasurementNumberLineValue | null | undefined,
    numberKind: MeasurementNumberLineProblem['numberKind'],
    unitId: MeasurementNumberLineUnitId
): value is MeasurementNumberLineValue => {
    if (value == null
        || typeof value !== 'object'
        || !Number.isSafeInteger(value.numerator)
        || value.numerator < 0
        || !Number.isSafeInteger(value.denominator)
        || value.denominator <= 0) return false;

    if (numberKind === 'fraction') {
        return gcd(value.numerator, value.denominator) === 1;
    }

    return value.denominator === (unitId === 'dollar' ? 100 : 10);
};

const equalsTickPosition = (
    value: MeasurementNumberLineValue,
    index: number,
    tickCount: number
): boolean => BigInt(value.numerator) * BigInt(tickCount)
    === BigInt(index) * BigInt(value.denominator);

export const formatMeasurementNumberLineValue = (
    value: MeasurementNumberLineValue,
    numberKind: MeasurementNumberLineProblem['numberKind']
): string => {
    if (numberKind === 'fraction') {
        if (value.numerator === 0) return '0';
        if (value.numerator === value.denominator) return '1';
        return `${value.numerator}/${value.denominator}`;
    }

    const digits = value.denominator === 100 ? 2 : 1;
    return (value.numerator / value.denominator).toFixed(digits);
};

export const formatMeasurementQuantity = (
    value: MeasurementNumberLineValue,
    numberKind: MeasurementNumberLineProblem['numberKind'],
    unitId: MeasurementNumberLineUnitId
): string => {
    const display = formatMeasurementNumberLineValue(value, numberKind);
    const unit = UNITS[unitId];
    if (unitId === 'dollar') {
        if (numberKind === 'decimal') return `$${display}`;
        if (value.numerator === 0) return '0 dollars';
        if (value.numerator === value.denominator) return '1 dollar';
        return `${display} of a dollar`;
    }
    if (numberKind === 'fraction'
        && value.numerator > 0
        && value.numerator < value.denominator) {
        return `${display} of ${unitId === 'hour' ? 'an' : 'a'} ${unit.singular}`;
    }
    const unitName = value.numerator === value.denominator ? unit.singular : unit.plural;
    return `${display} ${unitName}`;
};

export const getMeasurementNumberLinePresentation = (data: MeasurementNumberLineProblem) => {
    const tickCount = data.tickValues.length - 1;
    const interval = data.tickValues[1]!;
    const targetValue = data.tickValues[data.targetIndex]!;
    const targetQuantity = formatMeasurementQuantity(targetValue, data.numberKind, data.unitId);
    const intervalQuantity = formatMeasurementQuantity(interval, data.numberKind, data.unitId);

    return {
        unit: UNITS[data.unitId],
        tickCount,
        targetQuantity,
        prompt: `Plot ${targetQuantity} on the number line.`,
        scaleStatement: `Each equal interval represents ${intervalQuantity}.`,
        answerStatement: `${targetQuantity} belongs at tick ${data.targetIndex} after zero.`,
        explanation: `Starting at zero, count ${data.targetIndex} equal intervals of ${intervalQuantity}. The point lands at ${targetQuantity}.`
    };
};

export const getMeasurementPointLabelX = (
    pointX: number,
    left = 62,
    right = 778,
    halfWidth = 125
): number => Math.min(right - halfWidth, Math.max(left + halfWidth, pointX));

export const isValidMeasurementNumberLineProblem = (
    data: MeasurementNumberLineProblem
): boolean => {
    const expectedUnitId = UNIT_IDS[data.measurementKind];
    if (expectedUnitId === undefined || data.unitId !== expectedUnitId) return false;
    if (data.numberKind !== 'fraction' && data.numberKind !== 'decimal') return false;
    if (!Array.isArray(data.tickValues)) return false;

    const tickCount = data.tickValues.length - 1;
    if (data.numberKind === 'fraction' && tickCount !== 4 && tickCount !== 8) return false;
    if (data.numberKind === 'decimal' && tickCount !== 10) return false;

    for (let index = 0; index <= tickCount; index++) {
        const value = data.tickValues[index];
        if (!isValidValue(value, data.numberKind, data.unitId)
            || !equalsTickPosition(value, index, tickCount)) return false;
    }

    return Number.isSafeInteger(data.targetIndex)
        && data.targetIndex > 1
        && data.targetIndex < tickCount;
};
