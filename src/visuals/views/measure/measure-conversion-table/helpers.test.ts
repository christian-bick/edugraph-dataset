import {describe, expect, it} from 'vitest';
import {
    MeasurementConversionPair,
    MeasurementConversionTableProblem
} from '../../../../types/problems.ts';
import {formatTableValue, hasCoherentConversionTable} from './helpers.ts';

const pairSeeds = [
    ['kilometer-meter', 'length', 'magnitude', 'kilometer', 'kilometers', 'km', 'meter', 'meters', 'm', 1000, 'One kilometer is 1,000 times as long as one meter.'],
    ['meter-centimeter', 'length', 'magnitude', 'meter', 'meters', 'm', 'centimeter', 'centimeters', 'cm', 100, 'One meter is 100 times as long as one centimeter.'],
    ['kilogram-gram', 'weight', 'magnitude', 'kilogram', 'kilograms', 'kg', 'gram', 'grams', 'g', 1000, 'One kilogram is 1,000 times as heavy as one gram.'],
    ['pound-ounce', 'weight', 'factor', 'pound', 'pounds', 'lb', 'ounce', 'ounces', 'oz', 16, 'One pound is 16 times as heavy as one ounce.'],
    ['liter-milliliter', 'liquid-volume', 'magnitude', 'liter', 'liters', 'L', 'milliliter', 'milliliters', 'mL', 1000, 'One liter holds 1,000 times as much liquid volume as one milliliter.'],
    ['hour-minute', 'time', 'factor', 'hour', 'hours', 'hr', 'minute', 'minutes', 'min', 60, 'One hour lasts 60 times as long as one minute.'],
    ['minute-second', 'time', 'factor', 'minute', 'minutes', 'min', 'second', 'seconds', 'sec', 60, 'One minute lasts 60 times as long as one second.']
] as const;

const pairs: MeasurementConversionPair[] = pairSeeds.map(([
    id,
    quantityKind,
    scalingKind,
    largerSingular,
    largerPlural,
    largerSymbol,
    smallerSingular,
    smallerPlural,
    smallerSymbol,
    factor,
    relativeSizeStatement
]) => ({
    id,
    quantityKind,
    scalingKind,
    largerUnit: {
        id: largerSingular,
        singular: largerSingular,
        plural: largerPlural,
        symbol: largerSymbol
    },
    smallerUnit: {
        id: smallerSingular,
        singular: smallerSingular,
        plural: smallerPlural,
        symbol: smallerSymbol
    },
    factor,
    equivalenceEquation: `1 ${largerSingular} = ${formatTableValue(factor)} ${smallerPlural}`,
    factorStatement: `Multiply a number of ${largerPlural} by ${formatTableValue(factor)} to find the equivalent number of ${smallerPlural}.`,
    relativeSizeStatement
}));

function table(pair: MeasurementConversionPair, startValue = 1): MeasurementConversionTableProblem {
    const rows = Array.from({length: 5}, (_, index) => {
        const largerValue = startValue + index;
        const smallerValue = largerValue * pair.factor;
        const largerUnit = largerValue === 1 ? pair.largerUnit.singular : pair.largerUnit.plural;
        const smallerUnit = smallerValue === 1 ? pair.smallerUnit.singular : pair.smallerUnit.plural;
        return {
            largerValue,
            smallerValue,
            measurementEquation: `${formatTableValue(largerValue)} ${largerUnit} = ${formatTableValue(smallerValue)} ${smallerUnit}`
        };
    });
    return {
        task: 'conversion-table',
        pair,
        prompt: `Complete the two-column conversion table from ${pair.largerUnit.plural} to ${pair.smallerUnit.plural}.`,
        rows,
        hiddenRowIndices: [3, 4],
        columnHeaders: [
            `${pair.largerUnit.plural[0].toUpperCase()}${pair.largerUnit.plural.slice(1)} (${pair.largerUnit.symbol})`,
            `${pair.smallerUnit.plural[0].toUpperCase()}${pair.smallerUnit.plural.slice(1)} (${pair.smallerUnit.symbol})`
        ],
        constantFactorStatement: pair.factorStatement,
        explanation: `Each ${pair.smallerUnit.singular} value equals its ${pair.largerUnit.singular} value multiplied by ${formatTableValue(pair.factor)}. For example, ${rows.at(-1)!.measurementEquation}.`
    };
}

describe('hasCoherentConversionTable', () => {
    it.each([1, 3, 5])('accepts all seven unit pairs with start value %i', startValue => {
        for (const pair of pairs) {
            expect(hasCoherentConversionTable(table(pair, startValue))).toBe(true);
        }
    });

    it('rejects inconsistent factors, rows, hidden indices, and required text', () => {
        const valid = table(pairs[0]);
        expect(hasCoherentConversionTable({...valid, pair: {...valid.pair, factor: 100}})).toBe(false);
        expect(hasCoherentConversionTable({
            ...valid,
            rows: valid.rows.map((row, index) => index === 1
                ? {...row, smallerValue: row.smallerValue + 1}
                : row)
        })).toBe(false);
        expect(hasCoherentConversionTable({...valid, rows: valid.rows.slice(0, 4)})).toBe(false);
        expect(hasCoherentConversionTable({...valid, hiddenRowIndices: [2, 4]})).toBe(false);
        expect(hasCoherentConversionTable({...valid, constantFactorStatement: 'Multiply by 10.'})).toBe(false);
        expect(hasCoherentConversionTable({...valid, columnHeaders: ['Kilometers', 'Meters']})).toBe(false);
        expect(hasCoherentConversionTable({
            ...valid,
            rows: valid.rows.map((row, index) => index === 4
                ? {...row, measurementEquation: '5 km = 5,000 m'}
                : row)
        })).toBe(false);
        expect(hasCoherentConversionTable(table(pairs[0], 6))).toBe(false);
        expect(hasCoherentConversionTable({...valid, explanation: 'Multiply every row.'})).toBe(false);
        expect(hasCoherentConversionTable({...valid, prompt: ''})).toBe(false);
    });
});

describe('formatTableValue', () => {
    it('groups large table values deterministically', () => {
        expect(formatTableValue(12000)).toBe('12,000');
    });
});
