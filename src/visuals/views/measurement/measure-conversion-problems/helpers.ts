import type {
    MeasurementConversionPair,
    MeasurementConversionStoryProblem,
    MeasurementConversionUnitId
} from '../../../../types/problems.ts';
import {
    getMeasurementUnitPresentation,
    isValidMeasurementConversionPair
} from '../../../helpers/measurement-conversion.ts';
import {
    formatConversionHundredths,
    formatConversionMeasurement
} from '../measure-conversion-helpers.ts';

const MAX_DISPLAY_HUNDREDTHS = 1_000_000;

const isDisplayableCount = (value: number): boolean =>
    Number.isSafeInteger(value) && value > 0 && value <= MAX_DISPLAY_HUNDREDTHS;

export const isValidMeasurementConversionStory = (data: MeasurementConversionStoryProblem): boolean => {
    if (!data || data.kind !== 'measurement-conversion-story'
        || !isValidMeasurementConversionPair(data.pair)
        || (data.numberKind !== 'integer' && data.numberKind !== 'decimal')
        || (data.sourceSide !== 'larger' && data.sourceSide !== 'smaller')
        || !data.conversion) return false;

    const {largerHundredths, smallerHundredths} = data.conversion;
    const {additionalTargetHundredths, totalTargetHundredths} = data;
    if (![largerHundredths, smallerHundredths, additionalTargetHundredths, totalTargetHundredths]
        .every(isDisplayableCount)
        || smallerHundredths !== largerHundredths * data.pair.factor) return false;

    const sourceHundredths = data.sourceSide === 'larger' ? largerHundredths : smallerHundredths;
    const convertedHundredths = data.sourceSide === 'larger' ? smallerHundredths : largerHundredths;
    if (totalTargetHundredths !== convertedHundredths + additionalTargetHundredths) return false;

    return data.numberKind === 'integer'
        ? [largerHundredths, smallerHundredths, additionalTargetHundredths, totalTargetHundredths]
            .every(count => count % 100 === 0)
        : sourceHundredths % 100 !== 0 || additionalTargetHundredths % 100 !== 0;
};

export type MeasurementConversionStoryPresentation = {
    story: string;
    question: string;
    targetUnitPlural: string;
    factorEquation: string;
    convertedEquality: string;
    additionEquation: string;
    answer: string;
};

const storyForPair = (
    pair: MeasurementConversionPair,
    source: string,
    additional: string,
    targetUnitPlural: string
): {story: string; question: string} => {
    switch (pair.id) {
        case 'kilometer-meter':
            return {
                story: `A walking route has one stretch of ${source} and another stretch of ${additional}.`,
                question: `What is the total route length in ${targetUnitPlural}?`
            };
        case 'meter-centimeter':
            return {
                story: `A tailor joins a strip of fabric measuring ${source} to another strip measuring ${additional}.`,
                question: `What is the combined length in ${targetUnitPlural}?`
            };
        case 'kilogram-gram':
            return {
                story: `One bag of produce weighs ${source}, and another bag weighs ${additional}.`,
                question: `What is the total weight of the bags in ${targetUnitPlural}?`
            };
        case 'pound-ounce':
            return {
                story: `A parcel contains one item weighing ${source} and another weighing ${additional}.`,
                question: `What is the total weight of the items in ${targetUnitPlural}?`
            };
        case 'liter-milliliter':
            return {
                story: `A pitcher receives ${source} of juice, then ${additional} more juice.`,
                question: `How much juice is in the pitcher altogether, in ${targetUnitPlural}?`
            };
        case 'hour-minute':
            return {
                story: `One stage of a trip lasts ${source}, and a second stage lasts ${additional}.`,
                question: `How long do both stages last in total, in ${targetUnitPlural}?`
            };
        case 'minute-second':
            return {
                story: `A runner spends ${source} on one lap and ${additional} on another lap.`,
                question: `What is the total running time in ${targetUnitPlural}?`
            };
    }
};

export const buildMeasurementConversionStoryPresentation = (
    data: MeasurementConversionStoryProblem
): MeasurementConversionStoryPresentation => {
    const {pair, sourceSide, conversion, additionalTargetHundredths, totalTargetHundredths} = data;
    const sourceUnit: MeasurementConversionUnitId = sourceSide === 'larger'
        ? pair.largerUnit : pair.smallerUnit;
    const targetUnit: MeasurementConversionUnitId = sourceSide === 'larger'
        ? pair.smallerUnit : pair.largerUnit;
    const sourceHundredths = sourceSide === 'larger'
        ? conversion.largerHundredths : conversion.smallerHundredths;
    const convertedHundredths = sourceSide === 'larger'
        ? conversion.smallerHundredths : conversion.largerHundredths;
    const source = formatConversionMeasurement(sourceHundredths, sourceUnit);
    const additional = formatConversionMeasurement(additionalTargetHundredths, targetUnit);
    const converted = formatConversionMeasurement(convertedHundredths, targetUnit);
    const answer = formatConversionMeasurement(totalTargetHundredths, targetUnit);
    const targetUnitPlural = getMeasurementUnitPresentation(targetUnit).plural;

    return {
        ...storyForPair(pair, source, additional, targetUnitPlural),
        targetUnitPlural,
        factorEquation: `${formatConversionHundredths(sourceHundredths)} ${sourceSide === 'larger' ? '×' : '÷'} ${formatConversionHundredths(pair.factor * 100)} = ${formatConversionHundredths(convertedHundredths)}`,
        convertedEquality: `${source} = ${converted}`,
        additionEquation: `${converted} + ${additional} = ${answer}`,
        answer
    };
};
