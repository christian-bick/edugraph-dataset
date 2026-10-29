import {random} from '../../lib/random.ts';
import type {
    MeasurementConversionNumericExamples,
    MeasurementConversionPair,
    MeasurementConversionPairId,
    MeasurementConversionValuesProblem,
    UnitEquivalenceSequenceProblem
} from '../../types/problems.ts';

/** Shared immutable named-unit facts for measurement conversion generators. */
export const measurementConversionPairSeeds = Object.freeze({
    'kilometer-meter': Object.freeze({
        id: 'kilometer-meter', quantityKind: 'length', scalingKind: 'magnitude',
        largerUnit: 'kilometer', smallerUnit: 'meter', factor: 1000
    }),
    'meter-centimeter': Object.freeze({
        id: 'meter-centimeter', quantityKind: 'length', scalingKind: 'magnitude',
        largerUnit: 'meter', smallerUnit: 'centimeter', factor: 100
    }),
    'kilogram-gram': Object.freeze({
        id: 'kilogram-gram', quantityKind: 'weight', scalingKind: 'magnitude',
        largerUnit: 'kilogram', smallerUnit: 'gram', factor: 1000
    }),
    'pound-ounce': Object.freeze({
        id: 'pound-ounce', quantityKind: 'weight', scalingKind: 'factor',
        largerUnit: 'pound', smallerUnit: 'ounce', factor: 16
    }),
    'liter-milliliter': Object.freeze({
        id: 'liter-milliliter', quantityKind: 'liquid-volume', scalingKind: 'magnitude',
        largerUnit: 'liter', smallerUnit: 'milliliter', factor: 1000
    }),
    'hour-minute': Object.freeze({
        id: 'hour-minute', quantityKind: 'time', scalingKind: 'factor',
        largerUnit: 'hour', smallerUnit: 'minute', factor: 60
    }),
    'minute-second': Object.freeze({
        id: 'minute-second', quantityKind: 'time', scalingKind: 'factor',
        largerUnit: 'minute', smallerUnit: 'second', factor: 60
    })
} satisfies Record<MeasurementConversionPairId, MeasurementConversionPair>);

const integerLargerHundredths = Array.from({length: 8}, (_, index) => (index + 2) * 100);
const decimalFractionHundredths = [
    1, 5, 10, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 99
] as const;
const decimalLargerHundredths = Array.from({length: 5}, (_, whole) =>
    decimalFractionHundredths.map(fraction => whole * 100 + fraction)).flat();

/** Five consecutive integer quantities, using one seeded draw for the first row. */
export const buildUnitEquivalenceSequence = (
    pair: MeasurementConversionPair,
    draw: () => number = random
): UnitEquivalenceSequenceProblem => {
    const startValue = 2 + Math.floor(draw() * 8);
    const equivalents = Array.from({length: 5}, (_, index) => {
        const largerValue = startValue + index;
        return {largerValue, smallerValue: largerValue * pair.factor};
    });
    return {pair, equivalents};
};

/** Two distinct exact equalities; the second draw selects among the remaining candidates. */
export const buildMeasurementConversionValues = (
    pair: MeasurementConversionPair,
    numberKind: MeasurementConversionNumericExamples['numberKind'],
    draw: () => number = random
): MeasurementConversionValuesProblem => {
    const candidates = numberKind === 'integer'
        ? integerLargerHundredths
        : decimalLargerHundredths;
    const firstIndex = Math.floor(draw() * candidates.length);
    const secondDraw = Math.floor(draw() * (candidates.length - 1));
    const secondIndex = secondDraw >= firstIndex ? secondDraw + 1 : secondDraw;
    const equality = (largerHundredths: number) => ({
        largerHundredths,
        smallerHundredths: largerHundredths * pair.factor
    });
    return {pair, numericExamples: {
        numberKind,
        equalities: [equality(candidates[firstIndex]!), equality(candidates[secondIndex]!)]
    }};
};
