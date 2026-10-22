import {describe, expect, it} from 'vitest';
import {isRationalCoordinateAxis} from '../coordinate/rational-coordinate-helpers.ts';
import {isRationalNumberlineValues} from './rational-numberline-helpers.ts';
import {decimalLineOracle, fractionLineOracle, integerLineOracle, threeTickLineOracle} from './rational-numberline-fixtures.ts';

describe('exact rational number-line contract', () => {
    it('accepts literal signed, asymmetric, nonnegative and mixed-form exact models', () => {
        for (const data of [integerLineOracle, fractionLineOracle, decimalLineOracle, threeTickLineOracle]) expect(isRationalNumberlineValues(data)).toBe(true);
    });
    it('accepts all three tick positions including zero and both endpoints without narrowing notation', () => {
        const base = threeTickLineOracle;
        for (const [tickIndex, sign] of [[0, 0], [1, 1], [2, 1]] as const) {
            const value = base.axis.ticks[tickIndex]!;
            expect(isRationalNumberlineValues({...base, point: {value, magnitude: value, sign, tickIndex, notation: base.axis.tickNotations[tickIndex]}})).toBe(true);
        }
        expect(isRationalNumberlineValues({...integerLineOracle, point: {value: {numerator: 1, denominator: 1}, magnitude: {numerator: 1, denominator: 1}, sign: 1, tickIndex: 4, notation: {kind: 'fraction', numerator: 4, denominator: 4}}})).toBe(true);
    });
    it('requires three ticks for this family while retaining the generic two-tick coordinate contract', () => {
        const axis = {...threeTickLineOracle.axis, maximum: {numerator: 1, denominator: 2}, ticks: threeTickLineOracle.axis.ticks.slice(0, 2), tickNotations: threeTickLineOracle.axis.tickNotations.slice(0, 2)};
        expect(isRationalCoordinateAxis(axis)).toBe(true);
        expect(isRationalNumberlineValues({...threeTickLineOracle, axis})).toBe(false);
    });
    it('rejects inconsistent indices, magnitudes, signs, canonical fractions and exact numeral witnesses', () => {
        for (const point of [
            {...fractionLineOracle.point, tickIndex: 3}, {...fractionLineOracle.point, tickIndex: -1}, {...fractionLineOracle.point, tickIndex: 11},
            {...fractionLineOracle.point, sign: 1}, {...fractionLineOracle.point, magnitude: {numerator: -3, denominator: 4}},
            {...fractionLineOracle.point, value: {numerator: -6, denominator: 8}}, {...fractionLineOracle.point, notation: {kind: 'fraction', numerator: -7, denominator: 8}},
            {...fractionLineOracle.point, notation: {kind: 'decimal', coefficient: -75, scale: 2, numeral: '-0.750'}},
            {...threeTickLineOracle.point, sign: -0}, {...threeTickLineOracle.point, tickIndex: -0},
            {...threeTickLineOracle.point, value: {numerator: -0, denominator: 1}},
            {...threeTickLineOracle.point, notation: {kind: 'decimal', coefficient: 0, scale: 16, numeral: '0.0000000000000000'}}
        ]) expect(isRationalNumberlineValues({...fractionLineOracle, point})).toBe(false);
    });
    it('rejects malformed, sparse and incomplete scale data without throwing', () => {
        const sparseTicks = [...fractionLineOracle.axis.ticks];
        delete sparseTicks[1];
        const sparseForms = [...fractionLineOracle.axis.tickNotations];
        delete sparseForms[1];
        for (const axis of [
            {...fractionLineOracle.axis, ticks: sparseTicks}, {...fractionLineOracle.axis, tickNotations: sparseForms},
            {...fractionLineOracle.axis, step: {numerator: 0, denominator: 1}}, {...fractionLineOracle.axis, zeroIndex: 4},
            {...fractionLineOracle.axis, minimum: fractionLineOracle.axis.maximum}, {...fractionLineOracle.axis, stepNotation: {kind: 'decimal', coefficient: 2, scale: 1, numeral: '0.2'}}
        ]) expect(isRationalNumberlineValues({...fractionLineOracle, axis})).toBe(false);
        for (const value of [null, undefined, {}, [], {...fractionLineOracle, kind: 'coordinate-points'}, {...fractionLineOracle, point: null}]) expect(isRationalNumberlineValues(value)).toBe(false);
    });
    it('rejects IEEE negative zero independently in each located-zero witness', () => {
        const data = threeTickLineOracle;
        for (const point of [
            {...data.point, sign: -0}, {...data.point, tickIndex: -0},
            {...data.point, value: {numerator: -0, denominator: 1}}, {...data.point, magnitude: {numerator: -0, denominator: 1}},
            {...data.point, notation: {kind: 'fraction', numerator: -0, denominator: 7}},
            {...data.point, notation: {kind: 'decimal', coefficient: -0, scale: 2, numeral: '0.00'}}
        ]) expect(isRationalNumberlineValues({...data, point})).toBe(false);
    });
});
