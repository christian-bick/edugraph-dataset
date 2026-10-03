import type {MeasurementConversionPair, MeasurementConversionStoryProblem} from '../../../../types/problems.ts';

export const pairs = [
    {id: 'kilometer-meter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'kilometer', smallerUnit: 'meter', factor: 1000},
    {id: 'meter-centimeter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'meter', smallerUnit: 'centimeter', factor: 100},
    {id: 'kilogram-gram', quantityKind: 'weight', scalingKind: 'magnitude', largerUnit: 'kilogram', smallerUnit: 'gram', factor: 1000},
    {id: 'pound-ounce', quantityKind: 'weight', scalingKind: 'factor', largerUnit: 'pound', smallerUnit: 'ounce', factor: 16},
    {id: 'liter-milliliter', quantityKind: 'liquid-volume', scalingKind: 'magnitude', largerUnit: 'liter', smallerUnit: 'milliliter', factor: 1000},
    {id: 'hour-minute', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'hour', smallerUnit: 'minute', factor: 60},
    {id: 'minute-second', quantityKind: 'time', scalingKind: 'factor', largerUnit: 'minute', smallerUnit: 'second', factor: 60}
] as const satisfies readonly MeasurementConversionPair[];

export function storyFor(
    pair: MeasurementConversionPair,
    sourceSide: 'larger' | 'smaller',
    numberKind: 'integer' | 'decimal'
): MeasurementConversionStoryProblem {
    const largerHundredths = numberKind === 'integer' ? 200 : 125;
    const smallerHundredths = largerHundredths * pair.factor;
    const additionalTargetHundredths = numberKind === 'integer' ? 300 : 150;
    return {
        kind: 'measurement-conversion-story', pair, sourceSide, numberKind,
        conversion: {largerHundredths, smallerHundredths},
        additionalTargetHundredths,
        totalTargetHundredths: (sourceSide === 'larger' ? smallerHundredths : largerHundredths)
            + additionalTargetHundredths
    };
}
