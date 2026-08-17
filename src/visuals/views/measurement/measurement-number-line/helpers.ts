import {
    MeasurementNumberLineKind,
    MeasurementNumberLineProblem,
    MeasurementNumberLineUnit,
    MeasurementNumberLineValue
} from '../../../../types/problems.ts';

const UNITS: Record<MeasurementNumberLineKind, MeasurementNumberLineUnit> = {
    length: {id: 'meter', singular: 'meter', plural: 'meters', symbol: 'm', symbolPlacement: 'suffix'},
    time: {id: 'hour', singular: 'hour', plural: 'hours', symbol: 'h', symbolPlacement: 'suffix'},
    'liquid-volume': {id: 'liter', singular: 'liter', plural: 'liters', symbol: 'L', symbolPlacement: 'suffix'},
    weight: {id: 'kilogram', singular: 'kilogram', plural: 'kilograms', symbol: 'kg', symbolPlacement: 'suffix'},
    money: {id: 'dollar', singular: 'dollar', plural: 'dollars', symbol: '$', symbolPlacement: 'prefix'}
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

const sameUnit = (
    actual: MeasurementNumberLineUnit | null | undefined,
    expected: MeasurementNumberLineUnit
): boolean => actual != null
    && typeof actual === 'object'
    && actual.id === expected.id
    && actual.singular === expected.singular
    && actual.plural === expected.plural
    && actual.symbol === expected.symbol
    && actual.symbolPlacement === expected.symbolPlacement;

const sameValue = (
    left: MeasurementNumberLineValue,
    right: MeasurementNumberLineValue
): boolean => left.numerator === right.numerator
    && left.denominator === right.denominator
    && left.display === right.display
    && left.quantityText === right.quantityText;

const fractionDisplay = (value: MeasurementNumberLineValue): string => {
    if (value.numerator === 0) return '0';
    if (value.numerator === value.denominator) return '1';
    return `${value.numerator}/${value.denominator}`;
};

const expectedQuantityText = (
    value: MeasurementNumberLineValue,
    numberKind: MeasurementNumberLineProblem['numberKind'],
    unit: MeasurementNumberLineUnit
): string => {
    if (unit.id === 'dollar') {
        if (numberKind === 'decimal') return `$${value.display}`;
        if (value.numerator === 0) return '0 dollars';
        if (value.numerator === value.denominator) return '1 dollar';
        return `${value.display} of a dollar`;
    }
    if (numberKind === 'fraction'
        && value.numerator > 0
        && value.numerator < value.denominator) {
        const article = unit.id === 'hour' ? 'an' : 'a';
        return `${value.display} of ${article} ${unit.singular}`;
    }
    const singular = value.numerator === value.denominator;
    return `${value.display} ${singular ? unit.singular : unit.plural}`;
};

const isValidValue = (
    value: MeasurementNumberLineValue | null | undefined,
    numberKind: MeasurementNumberLineProblem['numberKind'],
    unit: MeasurementNumberLineUnit
): value is MeasurementNumberLineValue => {
    if (value == null
        || typeof value !== 'object'
        || !Number.isSafeInteger(value.numerator)
        || value.numerator < 0
        || !Number.isSafeInteger(value.denominator)
        || value.denominator <= 0
        || typeof value.display !== 'string'
        || typeof value.quantityText !== 'string') return false;
    if (numberKind === 'fraction') {
        if (gcd(value.numerator, value.denominator) !== 1
            || value.display !== fractionDisplay(value)) return false;
    } else {
        const denominator = unit.id === 'dollar' ? 100 : 10;
        const digits = unit.id === 'dollar' ? 2 : 1;
        if (value.denominator !== denominator
            || value.display !== (value.numerator / denominator).toFixed(digits)) return false;
    }
    return value.quantityText === expectedQuantityText(value, numberKind, unit);
};

const equalsTickPosition = (
    value: MeasurementNumberLineValue,
    index: number,
    tickCount: number
): boolean => BigInt(value.numerator) * BigInt(tickCount)
    === BigInt(index) * BigInt(value.denominator);

export const getMeasurementPointLabelX = (
    pointX: number,
    left = 62,
    right = 778,
    halfWidth = 125
): number => Math.min(right - halfWidth, Math.max(left + halfWidth, pointX));

export const isValidMeasurementNumberLineProblem = (
    data: MeasurementNumberLineProblem
): boolean => {
    if (data.task !== 'grade4-measurement-number-line') return false;
    const unit = UNITS[data.measurementKind];
    if (!unit || !sameUnit(data.unit, unit)) return false;
    if (data.numberKind !== 'fraction' && data.numberKind !== 'decimal') return false;
    if (![4, 8, 10].includes(data.tickCount)
        || data.numberKind === 'fraction' && data.tickCount === 10
        || data.numberKind === 'decimal' && data.tickCount !== 10
        || !Array.isArray(data.ticks)
        || data.ticks.length !== data.tickCount + 1) return false;

    for (let index = 0; index <= data.tickCount; index++) {
        const tick = data.ticks[index];
        if (tick == null
            || typeof tick !== 'object'
            || tick.index !== index
            || !isValidValue(tick.value, data.numberKind, unit)
            || !equalsTickPosition(tick.value, index, data.tickCount)) return false;
    }

    if (!Array.isArray(data.labeledTickIndices)
        || data.labeledTickIndices.length !== 3
        || data.labeledTickIndices[0] !== 0
        || data.labeledTickIndices[1] !== 1
        || data.labeledTickIndices[2] !== data.tickCount
        || !isValidValue(data.start, data.numberKind, unit)
        || !isValidValue(data.end, data.numberKind, unit)
        || !isValidValue(data.interval, data.numberKind, unit)
        || !sameValue(data.start, data.ticks[0]!.value)
        || !sameValue(data.end, data.ticks[data.tickCount]!.value)
        || !sameValue(data.interval, data.ticks[1]!.value)) return false;

    if (data.target == null
        || typeof data.target !== 'object'
        || !Number.isSafeInteger(data.target.index)
        || data.target.index <= 1
        || data.target.index >= data.tickCount
        || data.labeledTickIndices.includes(data.target.index)
        || !isValidValue(data.target.value, data.numberKind, unit)
        || !sameValue(data.target.value, data.ticks[data.target.index]!.value)) return false;

    return data.prompt === `Plot ${data.target.value.quantityText} on the number line.`
        && data.scaleStatement === `Each equal interval represents ${data.interval.quantityText}.`
        && data.answerStatement
            === `${data.target.value.quantityText} belongs at tick ${data.target.index} after zero.`
        && data.explanation
            === `Starting at zero, count ${data.target.index} equal intervals of ${data.interval.quantityText}. The point lands at ${data.target.value.quantityText}.`;
};
