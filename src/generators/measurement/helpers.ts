import type {
    MeasurementConversionPair,
    MeasurementConversionPairId
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
