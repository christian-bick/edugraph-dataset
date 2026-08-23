import {describe, expect, it} from 'vitest';
import {MeasurementConversionPair} from '../../types/problems.ts';
import {
    formatFactorInstruction,
    formatMeasurement,
    formatMeasurementEquation,
    formatRelativeSizeStatement,
    formatUnitEquivalence,
    getMeasurementUnitPresentation,
    isValidMeasurementConversionPair
} from './measurement-conversion.ts';

const hourMinute: MeasurementConversionPair = {
    id: 'hour-minute',
    quantityKind: 'time',
    scalingKind: 'factor',
    largerUnit: 'hour',
    smallerUnit: 'minute',
    factor: 60
};

describe('measurement-conversion presentation', () => {
    it('validates canonical pair semantics', () => {
        expect(isValidMeasurementConversionPair(hourMinute)).toBe(true);
        expect(isValidMeasurementConversionPair({...hourMinute, factor: 16})).toBe(false);
        expect(isValidMeasurementConversionPair({
            ...hourMinute,
            id: 'minute-second'
        })).toBe(false);
    });

    it('derives all language and notation from canonical unit identifiers', () => {
        expect(getMeasurementUnitPresentation('hour')).toEqual({
            singular: 'hour',
            plural: 'hours',
            symbol: 'hr'
        });
        expect(formatMeasurement(1, 'hour')).toBe('1 hour');
        expect(formatMeasurement(4, 'minute')).toBe('4 minutes');
        expect(formatMeasurementEquation(4, 240, hourMinute)).toBe(
            '4 hours = 240 minutes'
        );
        expect(formatUnitEquivalence(hourMinute)).toBe('1 hour = 60 minutes');
        expect(formatFactorInstruction(hourMinute)).toBe(
            'Multiply a number of hours by 60 to find the equivalent number of minutes.'
        );
        expect(formatRelativeSizeStatement(hourMinute)).toBe(
            'One hour lasts 60 times as long as one minute.'
        );
    });

    it.each([
        [{...hourMinute, id: 'kilometer-meter', quantityKind: 'length', scalingKind: 'magnitude', largerUnit: 'kilometer', smallerUnit: 'meter', factor: 1000}, 'One kilometer is 1,000 times as long as one meter.'],
        [{...hourMinute, id: 'kilogram-gram', quantityKind: 'weight', scalingKind: 'magnitude', largerUnit: 'kilogram', smallerUnit: 'gram', factor: 1000}, 'One kilogram is 1,000 times as heavy as one gram.'],
        [{...hourMinute, id: 'liter-milliliter', quantityKind: 'liquid-volume', scalingKind: 'magnitude', largerUnit: 'liter', smallerUnit: 'milliliter', factor: 1000}, 'One liter holds 1,000 times as much liquid volume as one milliliter.']
    ] as const)('formats the %s relative-size statement', (pair, expected) => {
        expect(formatRelativeSizeStatement(pair as MeasurementConversionPair)).toBe(expected);
    });
});
