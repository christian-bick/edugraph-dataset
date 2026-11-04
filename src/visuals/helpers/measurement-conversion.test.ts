import {describe, expect, it} from 'vitest';
import {MeasurementConversionPair} from '../../types/problems.ts';
import {
    formatFactorInstruction,
    formatMeasurement,
    formatMeasurementEquation,
    formatRelativeSizeStatement,
    formatUnitEquivalence,
    getMeasurementUnitPresentation,
    isValidMeasurementConversionPair,
    isValidUnitEquivalenceSequence,
    isValidUnitEquivalence
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


describe('unit-equivalence sequence validation', () => {
    it('accepts all five consecutive rows at the upper boundary without the numeric-value bound', () => {
        const pair = {id: 'kilometer-meter', quantityKind: 'length', scalingKind: 'magnitude',
            largerUnit: 'kilometer', smallerUnit: 'meter', factor: 1000} as const;
        const equivalents = Array.from({length: 5}, (_, index) => ({
            largerValue: 9 + index, smallerValue: (9 + index) * 1000
        }));
        expect(isValidUnitEquivalenceSequence({pair, equivalents})).toBe(true);
        const sparse = [...equivalents];
        delete sparse[2];
        expect(isValidUnitEquivalenceSequence({pair, equivalents: sparse})).toBe(false);
    });
});

describe('single unit-equivalence validation', () => {
    it('accepts every exact native single equality while separating the five-row family', () => {
        for (let start = 2; start <= 9; start++) {
            const equivalent = {largerValue: start, smallerValue: start * 60};
            const single = {kind: 'unit-equivalence' as const, pair: hourMinute, equivalent};
            const sequence = {pair: hourMinute, equivalents: Array.from({length: 5}, (_, i) =>
                ({largerValue: start + i, smallerValue: (start + i) * 60}))};
            expect(isValidUnitEquivalence(single)).toBe(true);
            expect(isValidUnitEquivalenceSequence(sequence)).toBe(true);
            expect(isValidUnitEquivalence(sequence as never)).toBe(false);
            expect(isValidUnitEquivalenceSequence(single as never)).toBe(false);
            expect(isValidUnitEquivalence({...single, equivalents: sequence.equivalents} as never)).toBe(false);
            expect(isValidUnitEquivalenceSequence({...sequence, kind: 'unit-equivalence'} as never)).toBe(false);
        }
    });

    it('rejects missing, unsafe, nonnative and inconsistent values before rendering', () => {
        const valid = {kind: 'unit-equivalence' as const, pair: hourMinute, equivalent: {largerValue: 2, smallerValue: 120}};
        for (const data of [null, {}, {...valid, kind: 'other'}, {...valid, equivalent: undefined},
            {...valid, pair: {...hourMinute, factor: 16}},
            ...[0, 1, 10, 2.5, NaN, Number.MAX_SAFE_INTEGER + 1].map(largerValue => ({...valid,
                equivalent: {largerValue, smallerValue: largerValue * 60}})),
            ...[119, 120.5, Infinity].map(smallerValue => ({...valid, equivalent: {largerValue: 2, smallerValue}}))])
            expect(isValidUnitEquivalence(data as never)).toBe(false);
    });
});
