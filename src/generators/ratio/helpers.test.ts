import {describe, expect, it} from 'vitest';
import {setSeed} from '../../lib/random.ts';
import {greatestCommonDivisor, pick, randomInteger, rational, ratioQuantities, ratioTable, validateMagnitudeRange} from './helpers.ts';

describe('ratio mathematical helpers', () => {
    it('reduces exact quantities, including zero and whole numbers', () => {
        expect(rational(12, 18)).toEqual({numerator: 2, denominator: 3});
        expect(rational(0, 8)).toEqual({numerator: 0, denominator: 1});
        expect(rational(8)).toEqual({numerator: 8, denominator: 1});
        expect(greatestCommonDivisor(18, 12)).toBe(6);
    });

    it.each([[1, 0], [1, -2], [-1, 2], [1.5, 2], [1, 1.5], [Number.MAX_SAFE_INTEGER + 1, 2]])(
        'rejects an invalid rational %s/%s', (numerator, denominator) => {
            expect(() => rational(numerator, denominator)).toThrow(RangeError);
        }
    );

    it('validates the supported magnitude bounds without silent defaults', () => {
        expect(validateMagnitudeRange('test', {min: 0, max: 20})).toBe(19);
        expect(validateMagnitudeRange('test', {min: 0, max: 100})).toBe(99);
        expect(validateMagnitudeRange('test', {min: 0, max: Number.MAX_SAFE_INTEGER})).toBe(99);
        for (const invalid of [null, 20, {}, {min: 1, max: 20}, {min: 0, max: 0}, {min: 0, max: Infinity}]) {
            expect(() => validateMagnitudeRange('test', invalid as never)).toThrow();
        }
    });

    it('constructs equivalent rows and aligned graph bounds', () => {
        expect(ratioTable([2, 3], ratioQuantities[0]!, [1, 2, 3, 4])).toMatchObject({
            base: [2, 3],
            rows: [
                {antecedent: 2, consequent: 3, scale: 1},
                {antecedent: 4, consequent: 6, scale: 2},
                {antecedent: 6, consequent: 9, scale: 3},
                {antecedent: 8, consequent: 12, scale: 4}
            ],
            coordinateScale: {xStep: 2, yStep: 3, xMax: 8, yMax: 12}
        });
    });

    it('draws reproducible values within inclusive integer bounds', () => {
        const draws = new Set<number>();
        for (let seed = 0; seed < 60; seed++) {
            setSeed(seed);
            draws.add(randomInteger(2, 4));
        }
        expect(draws).toEqual(new Set([2, 3, 4]));
        setSeed(42);
        const item = pick(ratioQuantities);
        setSeed(42);
        expect(pick(ratioQuantities)).toEqual(item);
    });

    it('bounds comparison-table graphs to at most ten steps', () => {
        const table = ratioTable([3, 2], ratioQuantities[0]!, [1, 2, 3, 17]);
        expect(table.coordinateScale).toEqual({xStep: 6, yStep: 4, xMax: 54, yMax: 36});
        expect(table.rows.at(-1)).toEqual({antecedent: 51, consequent: 34, scale: 17});
    });
});
