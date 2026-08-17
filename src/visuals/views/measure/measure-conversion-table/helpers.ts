import {
    MeasurementConversionPair,
    MeasurementConversionPairId,
    MeasurementConversionTableProblem,
    MeasurementConversionUnit
} from '../../../../types/problems.ts';

type PairRule = Pick<
    MeasurementConversionPair,
    'quantityKind' | 'scalingKind' | 'factor'
> & {
    largerUnit: MeasurementConversionUnit;
    smallerUnit: MeasurementConversionUnit;
    relativeSizeStatement: string;
};

const unit = (
    id: MeasurementConversionUnit['id'],
    singular: string,
    plural: string,
    symbol: string
): MeasurementConversionUnit => ({id, singular, plural, symbol});

const PAIR_RULES: Record<MeasurementConversionPairId, PairRule> = {
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

const hasText = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

const isPositiveSafeInteger = (value: unknown): value is number =>
    Number.isSafeInteger(value) && (value as number) > 0;

function hasValidUnit(unit: MeasurementConversionUnit): boolean {
    return Boolean(unit)
        && hasText(unit.id)
        && hasText(unit.singular)
        && hasText(unit.plural)
        && hasText(unit.symbol);
}

const sameUnit = (
    actual: MeasurementConversionUnit,
    expected: MeasurementConversionUnit
): boolean => hasValidUnit(actual)
    && actual.id === expected.id
    && actual.singular === expected.singular
    && actual.plural === expected.plural
    && actual.symbol === expected.symbol;

const capitalize = (value: string): string =>
    value.charAt(0).toUpperCase() + value.slice(1);

function hasValidPair(pair: MeasurementConversionPair): boolean {
    if (!pair || !hasText(pair.id) || !Object.hasOwn(PAIR_RULES, pair.id)) return false;
    const rule = PAIR_RULES[pair.id];
    const factorText = formatTableValue(rule.factor);
    return pair.quantityKind === rule.quantityKind
        && pair.scalingKind === rule.scalingKind
        && pair.factor === rule.factor
        && sameUnit(pair.largerUnit, rule.largerUnit)
        && sameUnit(pair.smallerUnit, rule.smallerUnit)
        && pair.equivalenceEquation === `1 ${rule.largerUnit.singular} = ${factorText} ${rule.smallerUnit.plural}`
        && pair.factorStatement === `Multiply a number of ${rule.largerUnit.plural} by ${factorText} to find the equivalent number of ${rule.smallerUnit.plural}.`
        && pair.relativeSizeStatement === rule.relativeSizeStatement;
}

export function hasCoherentConversionTable(data: MeasurementConversionTableProblem): boolean {
    if (!data
        || data.task !== 'conversion-table'
        || !hasValidPair(data.pair)
        || data.prompt !== `Complete the two-column conversion table from ${data.pair.largerUnit.plural} to ${data.pair.smallerUnit.plural}.`
        || !hasText(data.constantFactorStatement)
        || !hasText(data.explanation)
        || !Array.isArray(data.columnHeaders)
        || data.columnHeaders.length !== 2
        || data.columnHeaders[0] !== `${capitalize(data.pair.largerUnit.plural)} (${data.pair.largerUnit.symbol})`
        || data.columnHeaders[1] !== `${capitalize(data.pair.smallerUnit.plural)} (${data.pair.smallerUnit.symbol})`
        || !Array.isArray(data.rows)
        || data.rows.length !== 5
        || !Array.isArray(data.hiddenRowIndices)
        || data.hiddenRowIndices.length !== 2
        || data.hiddenRowIndices[0] !== 3
        || data.hiddenRowIndices[1] !== 4
        || data.constantFactorStatement !== data.pair.factorStatement) {
        return false;
    }

    const hiddenIndices = data.hiddenRowIndices;
    if (new Set(hiddenIndices).size !== hiddenIndices.length
        || hiddenIndices.some((index, position) => (
            !Number.isInteger(index)
            || index < 0
            || index >= data.rows.length
            || (position > 0 && index <= hiddenIndices[position - 1])
        ))) {
        return false;
    }

    const coherentRows = data.rows.every((row, index) => (
        Boolean(row)
        && isPositiveSafeInteger(row.largerValue)
        && isPositiveSafeInteger(row.smallerValue)
        && row.smallerValue === row.largerValue * data.pair.factor
        && hasText(row.measurementEquation)
        && row.measurementEquation === `${formatMeasure(row.largerValue, data.pair.largerUnit)} = ${formatMeasure(row.smallerValue, data.pair.smallerUnit)}`
        && (index === 0
            ? row.largerValue >= 1 && row.largerValue <= 5
            : row.largerValue === data.rows[index - 1].largerValue + 1)
    ));
    if (!coherentRows) return false;

    const finalRow = data.rows.at(-1)!;
    return data.explanation === `Each ${data.pair.smallerUnit.singular} value equals its ${data.pair.largerUnit.singular} value multiplied by ${formatTableValue(data.pair.factor)}. For example, ${finalRow.measurementEquation}.`;
}

function formatMeasure(value: number, unit: MeasurementConversionUnit): string {
    return `${formatTableValue(value)} ${value === 1 ? unit.singular : unit.plural}`;
}

export function formatTableValue(value: number): string {
    return value.toLocaleString('en-US');
}
