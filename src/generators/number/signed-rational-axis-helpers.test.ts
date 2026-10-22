import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {SignedRational, SignedRationalAxis} from '../../types/problems.ts';
import {isSignedRationalAxis, isSignedRationalLocation, makeSignedRationalAxis, makeSignedRationalLocation} from './signed-rational-axis-helpers.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const ticks = [r(-2), r(-3, 2), r(-1), r(-1, 2), r(0), r(1, 2), r(1), r(3, 2), r(2)];
const halfAxis: SignedRationalAxis = {minimum: r(-2), maximum: r(2), step: r(1, 2), ticks, zeroIndex: 4};

describe('generic exact scalar axes', () => {
    it('matches an independent half-step lattice and accepts endpoint-zero/asymmetric/two-tick scales', () => {
        expect(makeSignedRationalAxis(r(1, 2), -4, 4)).toEqual(halfAxis);
        for (const [first, last, zeroIndex] of [[0, 1, 0], [-1, 0, 1], [-2, 5, 2], [0, 3, 0]] as const) {
            const axis = makeSignedRationalAxis(r(2, 3), first, last);
            expect(isSignedRationalAxis(axis)).toBe(true);
            expect(axis.zeroIndex).toBe(zeroIndex);
            expect(Object.is(axis.zeroIndex, -0)).toBe(false);
            for (const [index, value] of axis.ticks.entries()) {
                expect(BigInt(value.numerator) * 3n).toBe(BigInt(index - zeroIndex) * 2n * BigInt(value.denominator));
            }
        }
        const wide = Array.from({length: 13}, (_, index) => r(index));
        expect(isSignedRationalAxis({minimum: r(0), maximum: r(12), step: r(1), ticks: wide, zeroIndex: 0})).toBe(true);
        const tiny = r(1, Number.MAX_SAFE_INTEGER);
        expect(isSignedRationalAxis({minimum: r(-1, Number.MAX_SAFE_INTEGER), maximum: tiny, step: tiny,
            ticks: [r(-1, Number.MAX_SAFE_INTEGER), r(0), tiny], zeroIndex: 1})).toBe(true);
    });

    it('rejects every malformed scale boundary, component, sequence and zero index', () => {
        const sparse = [...ticks]; delete sparse[2];
        const invalid: unknown[] = [null, [], {}, {...halfAxis, minimum: r(0, 2)}, {...halfAxis, maximum: r(3)},
            {...halfAxis, minimum: r(-3)}, {...halfAxis, step: r(-1)}, {...halfAxis, step: r(0)},
            {...halfAxis, ticks: null}, {...halfAxis, ticks: []}, {...halfAxis, ticks: [r(0)]}, {...halfAxis, ticks: sparse},
            {...halfAxis, ticks: [r(1), r(2)], minimum: r(1), maximum: r(2), step: r(1), zeroIndex: 0},
            {...halfAxis, ticks: ticks.map((tick, index) => index === 1 ? r(-5, 3) : tick)},
            {...halfAxis, zeroIndex: -1}, {...halfAxis, zeroIndex: 9}, {...halfAxis, zeroIndex: 3},
            {...halfAxis, zeroIndex: -0}, {...halfAxis, zeroIndex: 1.5}, {...halfAxis, zeroIndex: Infinity}];
        invalid.forEach(value => expect(isSignedRationalAxis(value)).toBe(false));
    });

    it('rejects malformed constructor input and overflowing products before allocating ticks', () => {
        for (const [step, first, last] of [[r(0), -2, 2], [r(-1), -2, 2], [r(2, 4), -2, 2],
            [r(1), 0.5, 2], [r(1), -2, 2.5], [r(1), 1, 2], [r(1), -2, -1], [r(1), 0, 0],
            [r(1), -6, 5], [r(Number.MAX_SAFE_INTEGER), -2, 2], [r(1), -0, 2], [r(1), 0, -0]] as const) {
            expect(() => makeSignedRationalAxis(step, first, last)).toThrow(GeneratorValidationError);
        }
    });
});

describe('exact scalar locations', () => {
    it('supplies signed values and nonnegative magnitudes at every tick including zero/endpoints', () => {
        for (const [index, value] of ticks.entries()) {
            const location = makeSignedRationalLocation(halfAxis, index);
            expect(location).toEqual({value, tickIndex: index, sign: Math.sign(value.numerator), magnitude: r(Math.abs(value.numerator), value.denominator)});
            expect(location.value).not.toBe(value);
            expect(isSignedRationalLocation(location, halfAxis)).toBe(true);
        }
        const zero = makeSignedRationalLocation(halfAxis, 4);
        expect(zero).toEqual({value: r(0), tickIndex: 4, sign: 0, magnitude: r(0)});
        expect(Object.is(zero.sign, -0)).toBe(false);
    });

    it('rejects invalid constructors and inconsistent supplied location evidence without throwing from guards', () => {
        for (const index of [-1, 9, -0, 0.5, NaN, Infinity]) {
            expect(() => makeSignedRationalLocation(halfAxis, index)).toThrow(GeneratorValidationError);
        }
        expect(() => makeSignedRationalLocation({} as SignedRationalAxis, 0)).toThrow(GeneratorValidationError);
        const location = makeSignedRationalLocation(halfAxis, 1);
        expect(isSignedRationalLocation(location, {} as SignedRationalAxis)).toBe(false);
        for (const value of [null, {}, {...location, value: r(-6, 4)}, {...location, magnitude: r(-3, 2)},
            {...location, magnitude: r(1)}, {...location, magnitude: r(6, 4)}, {...location, tickIndex: -1},
            {...location, tickIndex: 9}, {...location, tickIndex: -0}, {...location, tickIndex: '1'},
            {...location, value: r(-1)}, {...location, sign: 1}, {...location, sign: -0},
            {...location, value: r(-0)}, {...location, magnitude: r(-0)}]) expect(isSignedRationalLocation(value, halfAxis)).toBe(false);
    });
});
