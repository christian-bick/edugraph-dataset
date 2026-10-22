import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {SignedRational} from '../../types/problems.ts';
import {absoluteSignedRational, compareSignedRationals, isCanonicalSignedRational, makeSignedRational, negateSignedRational} from './signed-rational-helpers.ts';

const gcd = (first: bigint, second: bigint): bigint => second === 0n ? first : gcd(second, first % second);

describe('canonical exact signed rationals', () => {
    it.each([
        [6, 4, 3, 2], [-6, 4, -3, 2], [5, 1, 5, 1], [0, 9, 0, 1], [-0, 5, 0, 1],
        [Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, 1, 1]
    ])('reduces %s/%s without a distinct negative zero', (n, d, numerator, denominator) => {
        const value = makeSignedRational(n, d);
        expect(value).toEqual({numerator, denominator});
        expect(isCanonicalSignedRational(value)).toBe(true);
        expect(Object.is(value.numerator, -0)).toBe(false);
    });

    it('preserves exact values across all small signed fractions', () => {
        for (let numerator = -60; numerator <= 60; numerator++) {
            for (let denominator = 1; denominator <= 12; denominator++) {
                const value = makeSignedRational(numerator, denominator);
                expect(BigInt(value.numerator) * BigInt(denominator)).toBe(BigInt(numerator) * BigInt(value.denominator));
                expect(gcd(BigInt(Math.abs(value.numerator)), BigInt(value.denominator))).toBe(1n);
                expect(value.denominator).toBeGreaterThan(0);
                expect(Object.is(value.numerator, -0)).toBe(false);
            }
        }
    });

    it('rejects invalid constructor components in either position', () => {
        for (const invalid of [NaN, Infinity, -Infinity, 0.25, Number.MAX_SAFE_INTEGER + 1]) {
            expect(() => makeSignedRational(invalid, 2)).toThrow(GeneratorValidationError);
            expect(() => makeSignedRational(2, invalid)).toThrow(GeneratorValidationError);
        }
        for (const denominator of [0, -0, -1]) expect(() => makeSignedRational(1, denominator)).toThrow(GeneratorValidationError);
    });

    it('guards supplied canonical data rather than silently reducing or repairing it', () => {
        const invalid: unknown[] = [null, undefined, 1, '', false, [], {}, {numerator: '1', denominator: 2},
            {numerator: 1, denominator: '2'}, {numerator: NaN, denominator: 1}, {numerator: 1, denominator: Infinity},
            {numerator: 0.5, denominator: 2}, {numerator: 1, denominator: 0.5},
            {numerator: Number.MAX_SAFE_INTEGER + 1, denominator: 1}, {numerator: 1, denominator: Number.MAX_SAFE_INTEGER + 1},
            {numerator: 1, denominator: 0}, {numerator: 1, denominator: -1},
            {numerator: -0, denominator: 1}, {numerator: 0, denominator: 2}, {numerator: -2, denominator: 4}];
        for (const value of invalid) expect(isCanonicalSignedRational(value)).toBe(false);
        for (const value of [{numerator: 0, denominator: 1}, {numerator: -3, denominator: 2}, {numerator: 5, denominator: 4}]) {
            expect(isCanonicalSignedRational(value)).toBe(true);
        }
    });
});

describe('exact signed rational relations', () => {
    it.each([
        [{numerator: -3, denominator: 2}, {numerator: 3, denominator: 2}],
        [{numerator: 5, denominator: 4}, {numerator: 5, denominator: 4}],
        [{numerator: 0, denominator: 1}, {numerator: 0, denominator: 1}]
    ])('supplies absolute values and involutive negation for %j', (value, magnitude) => {
        const original = {...value};
        const opposite = negateSignedRational(value);
        expect(absoluteSignedRational(value)).toEqual(magnitude);
        expect(negateSignedRational(opposite)).toEqual(value);
        expect(opposite.numerator).toBe(value.numerator === 0 ? 0 : -value.numerator);
        expect(Object.is(opposite.numerator, -0)).toBe(false);
        expect(value).toEqual(original);
    });

    it('orders different denominators, equality and products beyond safe integer precision', () => {
        expect(compareSignedRationals({numerator: -3, denominator: 2}, {numerator: 5, denominator: 4})).toBe(-1);
        expect(compareSignedRationals({numerator: 5, denominator: 4}, {numerator: -3, denominator: 2})).toBe(1);
        expect(compareSignedRationals({numerator: 0, denominator: 1}, {numerator: 0, denominator: 1})).toBe(0);
        const maximum = Number.MAX_SAFE_INTEGER;
        const first = {numerator: maximum - 1, denominator: maximum};
        const second = {numerator: maximum - 2, denominator: maximum - 1};
        expect(first.numerator / first.denominator).toBe(second.numerator / second.denominator);
        expect(compareSignedRationals(first, second)).toBe(1);
        expect(compareSignedRationals(negateSignedRational(first), negateSignedRational(second))).toBe(-1);
    });

    it('refuses noncanonical input to every supplied-value operation', () => {
        const invalid = {numerator: -0, denominator: 2};
        const valid = {numerator: 1, denominator: 1};
        expect(() => negateSignedRational(invalid)).toThrow(GeneratorValidationError);
        expect(() => absoluteSignedRational(invalid)).toThrow(GeneratorValidationError);
        expect(() => compareSignedRationals(invalid, valid)).toThrow(GeneratorValidationError);
        expect(() => compareSignedRationals(valid, invalid)).toThrow(GeneratorValidationError);
        expect(isCanonicalSignedRational(valid as SignedRational)).toBe(true);
    });
});
