import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {RationalCoordinateAxes, RationalCoordinateAxis, SignedRational, SignedRationalNotation} from '../../types/problems.ts';
import {isCoordinateNotation, isRationalCoordinateAxes, isRationalCoordinateAxis, isRationalCoordinatePoint,
    makeCoordinateAxis, makeCoordinateNotation, makeCoordinatePoint} from './coordinate-helpers.ts';

const r = (numerator: number, denominator = 1): SignedRational => ({numerator, denominator});
const halfTicks = [r(-2), r(-3, 2), r(-1), r(-1, 2), r(0), r(1, 2), r(1), r(3, 2), r(2)];
const halfAxis: RationalCoordinateAxis = {minimum: r(-2), maximum: r(2), step: r(1, 2), ticks: halfTicks, zeroIndex: 4,
    tickNotations: halfTicks.map(({numerator, denominator}) => ({kind: 'fraction', numerator, denominator})),
    stepNotation: {kind: 'fraction', numerator: 1, denominator: 2}};
const axes: RationalCoordinateAxes = {x: halfAxis, y: makeCoordinateAxis(r(1), -3, 3, 'integer')};

describe('exact coordinate notation', () => {
    it.each([
        [r(-2), 'integer', 2, {kind: 'integer', numeral: '-2'}],
        [r(-3, 2), 'fraction', 2, {kind: 'fraction', numerator: -3, denominator: 2}],
        [r(1, 2), 'decimal', 2, {kind: 'decimal', coefficient: 50, scale: 2, numeral: '0.50'}],
        [r(-3, 2), 'decimal', 2, {kind: 'decimal', coefficient: -150, scale: 2, numeral: '-1.50'}],
        [r(0), 'decimal', 2, {kind: 'decimal', coefficient: 0, scale: 2, numeral: '0.00'}],
        [r(3), 'decimal', 0, {kind: 'decimal', coefficient: 3, scale: 0, numeral: '3'}],
        [r(1, 1_000_000_000_000_000), 'decimal', 15, {kind: 'decimal', coefficient: 1, scale: 15, numeral: '0.000000000000001'}]
    ] as const)('preserves the exact form of %j as %s', (value, kind, scale, expected) => {
        const notation = makeCoordinateNotation(value, kind, scale);
        expect(notation).toEqual(expected);
        expect(isCoordinateNotation(value, notation)).toBe(true);
    });

    it('accepts unreduced literal fractions and exact zero forms without reducing their notation', () => {
        expect(isCoordinateNotation(r(1, 2), {kind: 'fraction', numerator: 2, denominator: 4})).toBe(true);
        expect(isCoordinateNotation(r(0), {kind: 'fraction', numerator: 0, denominator: 9})).toBe(true);
        expect(makeCoordinateNotation(r(1, 2), 'decimal')).toEqual({kind: 'decimal', coefficient: 50, scale: 2, numeral: '0.50'});
    });

    it('rejects malformed values/forms and decimal approximations', () => {
        expect(isCoordinateNotation(r(2, 4), {kind: 'fraction', numerator: 1, denominator: 2})).toBe(false);
        const invalid: unknown[] = [null, [], {}, {kind: 'integer', numeral: '+1'}, {kind: 'integer', numeral: '01'},
            {kind: 'fraction', numerator: 1, denominator: 0}, {kind: 'fraction', numerator: 1, denominator: -1},
            {kind: 'fraction', numerator: 1.5, denominator: 2}, {kind: 'fraction', numerator: Number.MAX_SAFE_INTEGER + 1, denominator: 2},
            {kind: 'fraction', numerator: -0, denominator: 2}, {kind: 'fraction', numerator: 1, denominator: 3},
            {kind: 'decimal', coefficient: 50, scale: 2, numeral: '0.5'}, {kind: 'decimal', coefficient: 51, scale: 2, numeral: '0.51'},
            {kind: 'decimal', coefficient: 50.5, scale: 2, numeral: '0.505'}, {kind: 'decimal', coefficient: -0, scale: 2, numeral: '-0.00'},
            {kind: 'decimal', coefficient: 50, scale: -1, numeral: '0.50'}, {kind: 'decimal', coefficient: 50, scale: 16, numeral: '0.50'},
            {kind: 'decimal', coefficient: 50, scale: 0.5, numeral: '0.50'}, {kind: 'decimal', coefficient: 50, scale: -0, numeral: '50'},
            {kind: 'decimal', coefficient: 50, scale: 2, numeral: '00.50'}, {kind: 'other'}];
        for (const notation of invalid) expect(isCoordinateNotation(r(1, 2), notation)).toBe(false);
        expect(isCoordinateNotation(r(1, 2), {kind: 'integer', numeral: '0.5'})).toBe(false);
        expect(isCoordinateNotation(r(1), {kind: 'integer', numeral: '1'})).toBe(true);
        for (const [value, kind, scale] of [[r(2, 4), 'fraction', 2], [r(1, 2), 'integer', 2], [r(1), 'other', 2],
            [r(1), 'decimal', 16], [r(1), 'decimal', -1], [r(1, 3), 'decimal', 2], [r(1, 4), 'decimal', 1],
            [r(Number.MAX_SAFE_INTEGER), 'decimal', 2]] as const) {
            expect(() => makeCoordinateNotation(value, kind as SignedRationalNotation['kind'], scale)).toThrow(GeneratorValidationError);
        }
    });
});

describe('complete exact coordinate frames', () => {
    it('constructs the literal half-step oracle and accepts endpoint zero/asymmetric frames', () => {
        expect(makeCoordinateAxis(r(1, 2), -4, 4, 'fraction')).toEqual(halfAxis);
        for (const [first, last, zeroIndex] of [[0, 4, 0], [-2, 0, 2], [-2, 5, 2], [0, 1, 0]] as const) {
            const axis = makeCoordinateAxis(r(1, 4), first, last, 'decimal');
            expect(axis.zeroIndex).toBe(zeroIndex);
            expect(Object.is(axis.zeroIndex, -0)).toBe(false);
            expect(isRationalCoordinateAxis(axis)).toBe(true);
        }
        expect(isRationalCoordinateAxes(axes)).toBe(true);
        const manyTicks = Array.from({length: 13}, (_, index) => r(index));
        expect(isRationalCoordinateAxis({minimum: r(0), maximum: r(12), step: r(1), zeroIndex: 0, ticks: manyTicks,
            tickNotations: manyTicks.map(({numerator}) => ({kind: 'integer', numeral: String(numerator)})), stepNotation: {kind: 'integer', numeral: '1'}})).toBe(true);
    });

    it('rejects incomplete/nonuniform or incorrectly notated frames, including sparse arrays', () => {
        const sparseTicks = [...halfAxis.ticks]; delete sparseTicks[1];
        const sparseNotations = [...halfAxis.tickNotations]; delete sparseNotations[2];
        const invalid = [null, {}, {...halfAxis, minimum: r(0, 2)}, {...halfAxis, maximum: r(3)}, {...halfAxis, step: r(0)},
            {...halfAxis, ticks: []}, {...halfAxis, ticks: [r(0)]}, {...halfAxis, ticks: sparseTicks},
            {...halfAxis, ticks: halfAxis.ticks.map((value, index) => index === 1 ? r(-5, 3) : value)},
            {...halfAxis, zeroIndex: -1}, {...halfAxis, zeroIndex: 9}, {...halfAxis, zeroIndex: 3}, {...halfAxis, zeroIndex: -0},
            {...halfAxis, tickNotations: null}, {...halfAxis, tickNotations: []}, {...halfAxis, tickNotations: sparseNotations},
            {...halfAxis, stepNotation: {kind: 'fraction', numerator: 1, denominator: 3}}, {...halfAxis, minimum: r(-3)}];
        invalid.forEach(axis => expect(isRationalCoordinateAxis(axis)).toBe(false));
        expect(isRationalCoordinateAxes(null)).toBe(false);
        expect(isRationalCoordinateAxes({x: halfAxis, y: {}})).toBe(false);
    });

    it('rejects invalid lattice-constructor parameters before allocating ticks', () => {
        for (const [step, first, last] of [[r(0), -2, 2], [r(2, 2), -2, 2], [r(1), 0.5, 2], [r(1), -2, 2.5],
            [r(1), 1, 2], [r(1), -2, -1], [r(1), 0, 0], [r(1), -6, 5], [r(Number.MAX_SAFE_INTEGER), -2, 2],
            [r(1), -0, 2]] as const) expect(() => makeCoordinateAxis(step, first, last, 'fraction')).toThrow(GeneratorValidationError);
    });
});

describe('formatted exact coordinate points', () => {
    it.each([[5, 4, 'quadrant-I'], [3, 4, 'quadrant-II'], [3, 2, 'quadrant-III'], [5, 2, 'quadrant-IV'],
        [5, 3, 'x-axis'], [4, 4, 'y-axis'], [4, 3, 'origin']] as const)('supplies exact signs/magnitudes/tag at indices %s,%s', (x, y, tag) => {
        const point = makeCoordinatePoint('P', axes, x, y);
        expect(point.locationTag).toBe(tag);
        expect(point.x.value).toEqual(axes.x.ticks[x]);
        expect(point.y.value).toEqual(axes.y.ticks[y]);
        expect(isRationalCoordinatePoint(point, axes)).toBe(true);
    });

    it('preserves literal unreduced fractions and decimal precision independently of axis forms', () => {
        const point = makeCoordinatePoint('P', axes, 5, 4, {x: {kind: 'fraction', numerator: 2, denominator: 4},
            y: {kind: 'decimal', coefficient: 100, scale: 2, numeral: '1.00'}});
        expect(point.x.notation).toEqual({kind: 'fraction', numerator: 2, denominator: 4});
        expect(point.y.notation).toEqual({kind: 'decimal', coefficient: 100, scale: 2, numeral: '1.00'});
        expect(isRationalCoordinatePoint(point, axes)).toBe(true);
    });

    it('rejects malformed point constructors and inconsistent supplied point metadata', () => {
        for (const [id, frame, x, y] of [['', axes, 5, 4], [' P', axes, 5, 4], [null, axes, 5, 4], ['P', {}, 5, 4],
            ['P', axes, -1, 4], ['P', axes, 9, 4], ['P', axes, 0.5, 4], ['P', axes, -0, 4],
            ['P', axes, 5, -1], ['P', axes, 5, 7], ['P', axes, 5, 0.5]] as const) {
            expect(() => makeCoordinatePoint(id as string, frame as RationalCoordinateAxes, x, y)).toThrow(GeneratorValidationError);
        }
        for (const notation of [null, {}, {x: {kind: 'integer', numeral: '1'}, y: {kind: 'integer', numeral: '1'}}]) {
            expect(() => makeCoordinatePoint('P', axes, 5, 4, notation as never)).toThrow(GeneratorValidationError);
        }
        const point = makeCoordinatePoint('P', axes, 5, 4);
        const zeroPoint = makeCoordinatePoint('Z', axes, 4, 3);
        const invalid = [null, {}, {...point, id: ''}, {...point, id: ' P'}, {...point, x: {}},
            {...point, x: {...point.x, tickIndex: -1}}, {...point, x: {...point.x, tickIndex: 9}},
            {...point, x: {...point.x, tickIndex: 0.5}}, {...point, x: {...point.x, value: r(1)}},
            {...point, x: {...point.x, magnitude: r(-1, 2)}}, {...point, x: {...point.x, magnitude: r(1, 3)}},
            {...point, x: {...point.x, sign: -1}}, {...zeroPoint, x: {...zeroPoint.x, sign: -0}},
            {...point, x: {...point.x, notation: {kind: 'integer', numeral: '1'}}}, {...point, y: {}}, {...point, locationTag: 'origin'}];
        invalid.forEach(value => expect(isRationalCoordinatePoint(value, axes)).toBe(false));
        expect(isRationalCoordinatePoint(point, {} as RationalCoordinateAxes)).toBe(false);
    });
});
