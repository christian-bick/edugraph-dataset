import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {MeasurementRatioRelationProblem, UnitDimensionRelationProblem} from '../../../types/problems.ts';
import {
    conversionProjection, dimensionUnitText, isMeasurementRatioRelation, isUnitDimensionRelation,
    measurementRationalText, physicalDimensionText, selectConversionDirection
} from './measurement-ratio-presentation.ts';

const conversion: MeasurementRatioRelationProblem = {
    kind: 'measurement-ratio-relation',
    units: {
        first: {id: 'inch', name: 'inch', symbol: 'in', system: 'customary', dimension: 'length'},
        second: {id: 'centimeter', name: 'centimeter', symbol: 'cm', system: 'metric', dimension: 'length'}
    },
    unitEquality: {first: {numerator: 50, denominator: 1}, second: {numerator: 127, denominator: 1}},
    quantityEquality: {first: {numerator: 75, denominator: 1}, second: {numerator: 381, denominator: 2}},
    scaleFactor: {numerator: 3, denominator: 2},
    forwardFactor: {numerator: 127, denominator: 50}, reverseFactor: {numerator: 50, denominator: 127}
};

const composition: UnitDimensionRelationProblem = {
    kind: 'unit-dimension-relation', operation: 'multiplication',
    left: {value: {numerator: 3, denominator: 2}, units: {m: 1, s: -1, kg: 0}, dimensions: {length: 1, time: -1, mass: 0}},
    right: {value: {numerator: 4, denominator: 1}, units: {m: 0, s: 1, kg: 0}, dimensions: {length: 0, time: 1, mass: 0}},
    result: {value: {numerator: 6, denominator: 1}, units: {m: 1, s: 0, kg: 0}, dimensions: {length: 1, time: 0, mass: 0}},
    unitFactors: {numerator: ['m', 's'], denominator: ['s']},
    cancellations: [{numeratorIndex: 1, denominatorIndex: 0}]
};

describe('exact measurement conversion witnesses', () => {
    it('accepts a rational across-system conversion and preserves both precomputed orientations', () => {
        expect(isMeasurementRatioRelation(conversion)).toBe(true);
        const forward = conversionProjection(conversion, 'first-to-second');
        expect(forward.sourceUnit.symbol).toBe('in');
        expect(forward.targetValue).toEqual({numerator: 381, denominator: 2});
        expect(forward.ratioNumerator).toEqual(conversion.unitEquality.second);
        expect(forward.ratioDenominator).toEqual(conversion.unitEquality.first);
        const reverse = conversionProjection(conversion, 'second-to-first');
        expect(reverse.sourceUnit.symbol).toBe('cm');
        expect(reverse.targetValue).toEqual({numerator: 75, denominator: 1});
        expect(reverse.numericFactor).toEqual({numerator: 50, denominator: 127});
        expect(reverse.ratioNumerator).toEqual(conversion.unitEquality.first);
    });

    it('rejects malformed units, physical dimension mismatch, and inconsistent numeric witnesses', () => {
        for (const invalid of [undefined, {}, {...conversion, kind: 'other'},
            {...conversion, units: {first: conversion.units.first, second: {...conversion.units.second, dimension: 'mass'}}},
            {...conversion, units: {first: conversion.units.first, second: {...conversion.units.second, id: 'inch'}}},
            {...conversion, units: {first: conversion.units.first, second: {...conversion.units.second, symbol: 'in'}}},
            {...conversion, units: {first: {...conversion.units.first, name: ''}, second: conversion.units.second}},
            {...conversion, units: {first: {...conversion.units.first, system: 'unknown'}, second: conversion.units.second}},
            {...conversion, scaleFactor: {numerator: 1, denominator: 2}},
            {...conversion, quantityEquality: {...conversion.quantityEquality, second: {numerator: 381, denominator: 1}}},
            {...conversion, unitEquality: {...conversion.unitEquality, first: {numerator: 0, denominator: 1}}},
            {...conversion, forwardFactor: conversion.reverseFactor},
            {...conversion, reverseFactor: conversion.forwardFactor}
        ]) expect(isMeasurementRatioRelation(invalid)).toBe(false);
    });

    it('chooses either task direction reproducibly through prepared configuration randomness', () => {
        const directions = new Set<string>();
        for (let seed = 1; seed <= 40; seed++) {
            setSeed(seed);
            const first = selectConversionDirection();
            directions.add(first);
            setSeed(seed);
            expect(selectConversionDirection()).toBe(first);
        }
        expect(directions).toEqual(new Set(['first-to-second', 'second-to-first']));
    });
});

describe('unit dimensionality witnesses', () => {
    it('accepts coherent operation values, signed unit powers, and complete indexed cancellation', () => {
        expect(isUnitDimensionRelation(composition)).toBe(true);
        expect(isUnitDimensionRelation({...composition, operation: 'division',
            right: {...composition.right, value: {numerator: 1, denominator: 4},
                units: {m: 0, s: -1, kg: 0}, dimensions: {length: 0, time: -1, mass: 0}}})).toBe(true);
    });

    it('rejects wrong operations, numeric answers, dimensions, raw factors, or cancellation pairs', () => {
        for (const invalid of [undefined, {}, {...composition, operation: 'addition'},
            {...composition, result: {...composition.result, value: {numerator: 5, denominator: 1}}},
            {...composition, left: {...composition.left, dimensions: {length: 0, time: -1, mass: 0}}},
            {...composition, right: {...composition.right, units: {m: 0, s: 1.5, kg: 0}}},
            {...composition, result: {...composition.result, units: {m: 2, s: 0, kg: 0}, dimensions: {length: 2, time: 0, mass: 0}}},
            {...composition, unitFactors: {numerator: ['m'], denominator: ['s']}},
            {...composition, unitFactors: {numerator: ['m', 'h'], denominator: ['h']}},
            {...composition, cancellations: undefined}, {...composition, cancellations: []},
            {...composition, cancellations: [{numeratorIndex: 0, denominatorIndex: 0}]},
            {...composition, cancellations: [{numeratorIndex: 2, denominatorIndex: 0}]},
            {...composition, cancellations: [{numeratorIndex: 1, denominatorIndex: -1}]},
            {...composition, cancellations: [composition.cancellations[0], composition.cancellations[0]]}
        ]) expect(isUnitDimensionRelation(invalid)).toBe(false);
    });

    it('formats exact rational measures, signed powers, and dimensionless results without dropping dimensions', () => {
        expect(measurementRationalText({numerator: 3, denominator: 2})).toBe('(3/2)');
        expect(measurementRationalText({numerator: 6, denominator: 1})).toBe('6');
        expect(dimensionUnitText({m: -3, s: 0, kg: 1})).toBe('kg / (m^3)');
        expect(physicalDimensionText({length: -3, time: 0, mass: 1})).toBe('mass / (length^3)');
        expect(physicalDimensionText({length: 0, time: 0, mass: 0})).toBe('dimensionless');
    });
});
