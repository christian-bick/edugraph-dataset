import {describe, expect, it} from 'vitest';
import {isOrderMagnitudeAxis, isRationalMagnitudeContext, isRationalMagnitudeRelation, isRationalOrderContext, isRationalOrderRelation} from './rational-order-magnitude-helpers.ts';
import {debtMagnitudeOracle, magnitudeLineOracle, oppositeMagnitudesOracle, orderLineOracle, quarterOrderAxis, temperatureOrderOracle, zeroContextMagnitudeOracle, zeroMagnitudeOracle} from './rational-order-magnitude-fixtures.ts';

describe('exact order and magnitude mathematical validation', () => {
    it('accepts independent exact negative order and its reversed nominal roles', () => {
        expect(isRationalOrderRelation(orderLineOracle)).toBe(true);
        expect(isRationalOrderRelation({...orderLineOracle, first: orderLineOracle.second, second: orderLineOracle.first, relation: 'less'})).toBe(true);
        expect(isRationalOrderContext(temperatureOrderOracle)).toBe(true);
        expect(isRationalOrderContext({...temperatureOrderOracle, first: temperatureOrderOracle.second, second: temperatureOrderOracle.first, relation: 'less'})).toBe(true);
    });
    it('accepts zero-length, endpoint-zero and generic two-tick magnitude members', () => {
        expect(isRationalMagnitudeRelation(magnitudeLineOracle)).toBe(true);
        expect(isRationalMagnitudeRelation(zeroMagnitudeOracle)).toBe(true);
        expect(isOrderMagnitudeAxis(quarterOrderAxis)).toBe(true);
        expect(isOrderMagnitudeAxis(zeroMagnitudeOracle.axis)).toBe(true);
    });
    it('distinguishes signed order, reversed magnitude order, equal opposite magnitudes and one-zero cases', () => {
        for (const data of [debtMagnitudeOracle, oppositeMagnitudesOracle, zeroContextMagnitudeOracle]) expect(isRationalMagnitudeContext(data)).toBe(true);
        expect(isRationalMagnitudeContext({...debtMagnitudeOracle, magnitudeRelation: 'less'})).toBe(false);
        expect(isRationalMagnitudeContext({...oppositeMagnitudesOracle, magnitudeRelation: 'greater'})).toBe(false);
        expect(isRationalMagnitudeContext({...zeroContextMagnitudeOracle, signedRelation: 'greater'})).toBe(false);
        expect(isRationalMagnitudeContext({...debtMagnitudeOracle, second: {...debtMagnitudeOracle.first, id: 'B'}, signedRelation: 'less', magnitudeRelation: 'equal'})).toBe(false);
    });
    it('compares large canonical fractions by exact cross-products', () => {
        const value = {numerator: 9007199254740991, denominator: 9007199254740990};
        const data = {...temperatureOrderOracle, first: {id: 'A', value, magnitude: value, sign: 1}, second: {id: 'B', value: {numerator: 1, denominator: 1}, magnitude: {numerator: 1, denominator: 1}, sign: 1}};
        expect(isRationalOrderContext(data)).toBe(true);
        expect(isRationalOrderContext({...data, relation: 'less'})).toBe(false);
    });
    it('rejects sparse, broken, zero-step and incorrect index scales without throwing', () => {
        const sparse = [...quarterOrderAxis.ticks]; delete sparse[2];
        for (const axis of [{...quarterOrderAxis, ticks: sparse}, {...quarterOrderAxis, ticks: new Array(9)}, {...quarterOrderAxis, step: {numerator: 0, denominator: 1}},
            {...quarterOrderAxis, zeroIndex: 7}, {...quarterOrderAxis, maximum: {numerator: 1, denominator: 1}}, {...quarterOrderAxis, ticks: [quarterOrderAxis.ticks[0]]}]) {
            expect(isRationalOrderRelation({...orderLineOracle, axis})).toBe(false);
            expect(isRationalMagnitudeRelation({...magnitudeLineOracle, axis})).toBe(false);
        }
        for (const first of [{...orderLineOracle.first, tickIndex: 1}, {...orderLineOracle.first, sign: 1}, {...orderLineOracle.first, magnitude: {numerator: 6, denominator: 4}}]) expect(isRationalOrderRelation({...orderLineOracle, first})).toBe(false);
        expect(isRationalOrderRelation({...orderLineOracle, second: orderLineOracle.first})).toBe(false);
    });
    it('rejects wrong distance endpoints, negative lengths and negative zero in each zero witness', () => {
        for (const distance of [{...magnitudeLineOracle.distance, fromTickIndex: 0}, {...magnitudeLineOracle.distance, toTickIndex: 2}, {...magnitudeLineOracle.distance, length: {numerator: -7, denominator: 4}}]) expect(isRationalMagnitudeRelation({...magnitudeLineOracle, distance})).toBe(false);
        for (const point of [{...zeroMagnitudeOracle.point, sign: -0}, {...zeroMagnitudeOracle.point, tickIndex: -0}, {...zeroMagnitudeOracle.point, value: {numerator: -0, denominator: 1}}, {...zeroMagnitudeOracle.point, magnitude: {numerator: -0, denominator: 1}}]) expect(isRationalMagnitudeRelation({...zeroMagnitudeOracle, point})).toBe(false);
        expect(isRationalMagnitudeRelation({...zeroMagnitudeOracle, distance: {...zeroMagnitudeOracle.distance, fromTickIndex: -0}})).toBe(false);
    });
    it('rejects metadata prototype keys, unsupported contexts and incoherent observation fields', () => {
        for (const context of [{kind: 'toString'}, {kind: 'constructor'}, {kind: 'charge', reference: 'neutral-net-charge', unit: 'coulombs'}, {...temperatureOrderOracle.context, unit: 'meters'}]) {
            expect(isRationalOrderContext({...temperatureOrderOracle, context})).toBe(false);
            expect(isRationalMagnitudeContext({...debtMagnitudeOracle, context})).toBe(false);
        }
        expect(isRationalOrderContext({...temperatureOrderOracle, second: {...temperatureOrderOracle.second, id: 'A'}})).toBe(false);
        expect(isRationalMagnitudeContext({...zeroContextMagnitudeOracle, first: {...zeroContextMagnitudeOracle.first, sign: -0}})).toBe(false);
        for (const value of [null, undefined, {}, [], {kind: 'other'}]) for (const guard of [isRationalOrderRelation, isRationalOrderContext, isRationalMagnitudeRelation, isRationalMagnitudeContext]) expect(guard(value)).toBe(false);
    });
});
