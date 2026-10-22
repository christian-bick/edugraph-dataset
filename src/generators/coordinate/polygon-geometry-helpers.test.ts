import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import {coordinateOrientation, coordinateSegmentsIntersect, isSimpleCoordinatePolygon, type ExactCoordinateVertex} from './polygon-geometry-helpers.ts';

const vertex = (x: number, y: number): ExactCoordinateVertex => ({x: {numerator: x, denominator: 1}, y: {numerator: y, denominator: 1}});
const polygon = (values: readonly (readonly [number, number])[]) => values.map(([x, y]) => vertex(x, y));
const grid = [-1, 0, 1].flatMap(x => [-1, 0, 1].map(y => vertex(x, y)));
const determinant = (a: ExactCoordinateVertex, b: ExactCoordinateVertex, c: ExactCoordinateVertex) =>
    (b.x.numerator - a.x.numerator) * (c.y.numerator - a.y.numerator)
    - (b.y.numerator - a.y.numerator) * (c.x.numerator - a.x.numerator);
function oracleIntersection(a: ExactCoordinateVertex, b: ExactCoordinateVertex, c: ExactCoordinateVertex, d: ExactCoordinateVertex): boolean {
    const on = (point: ExactCoordinateVertex, first: ExactCoordinateVertex, second: ExactCoordinateVertex) => determinant(first, second, point) === 0
        && point.x.numerator >= Math.min(first.x.numerator, second.x.numerator) && point.x.numerator <= Math.max(first.x.numerator, second.x.numerator)
        && point.y.numerator >= Math.min(first.y.numerator, second.y.numerator) && point.y.numerator <= Math.max(first.y.numerator, second.y.numerator);
    const first = determinant(a, b, c), second = determinant(a, b, d), third = determinant(c, d, a), fourth = determinant(c, d, b);
    return first * second < 0 && third * fourth < 0 || on(c, a, b) || on(d, a, b) || on(a, c, d) || on(b, c, d);
}

describe('exact coordinate orientation and closed segment predicates', () => {
    it('agrees with independent bounded integer determinant/intersection oracles exhaustively', () => {
        for (const first of grid) for (const second of grid) for (const third of grid) {
            const expected = Math.sign(determinant(first, second, third));
            expect(coordinateOrientation(first, second, third)).toBe(expected === 0 ? 0 : expected);
            for (const fourth of grid) expect(coordinateSegmentsIntersect(first, second, third, fourth))
                .toBe(oracleIntersection(first, second, third, fourth));
        }
    });

    it('retains exact rational orientation when rounded doubles coincide', () => {
        const maximum = Number.MAX_SAFE_INTEGER;
        const first = vertex(0, 0);
        const second = {x: {numerator: maximum, denominator: maximum - 1}, y: {numerator: 1, denominator: 1}};
        const third = {x: {numerator: maximum - 1, denominator: maximum - 2}, y: {numerator: 1, denominator: 1}};
        expect(coordinateOrientation(first, second, third)).toBe(-1);
        expect(coordinateOrientation(first, third, second)).toBe(1);
        const half = {x: {numerator: 1, denominator: 2}, y: {numerator: 1, denominator: 2}};
        expect(coordinateSegmentsIntersect(vertex(0, 0), vertex(1, 1), half, vertex(1, 0))).toBe(true);
    });

    it('rejects malformed scalar vertices before exact arithmetic', () => {
        for (const invalid of [null, undefined, {}, [], {x: {numerator: 2, denominator: 4}, y: {numerator: 0, denominator: 1}},
            {x: {numerator: 0, denominator: 1}, y: {numerator: -0, denominator: 1}}]) {
            expect(() => coordinateOrientation(invalid as never, vertex(0, 0), vertex(1, 1))).toThrow(GeneratorValidationError);
            expect(() => coordinateSegmentsIntersect(vertex(0, 0), vertex(1, 1), invalid as never, vertex(1, 0))).toThrow(GeneratorValidationError);
        }
    });
});

describe('simple noncollinear closed polygon boundaries', () => {
    it.each([
        [[0, 0], [4, 0], [0, 3]],
        [[0, 0], [4, 0], [4, 3], [0, 3]],
        [[0, 0], [3, 0], [4, 2], [2, 4], [0, 3]],
        [[0, 0], [4, 0], [4, 1], [1, 1], [1, 4], [0, 4]],
        [[0, 0], [4, 0], [4, 4], [2, 2], [0, 4]],
        [[0, 0], [1, 0], [2, 0], [2, 2], [0, 2]]
    ] as const)('accepts convex/concave/diagonal and harmless collinear subdivisions %j', (...values) => {
        const points = polygon(values);
        expect(isSimpleCoordinatePolygon(points)).toBe(true);
        expect(isSimpleCoordinatePolygon([...points].reverse())).toBe(true);
    });

    it('rejects duplicate vertices, degeneracy, crossings, touches and adjacent overlap including closing edge', () => {
        const invalid = [
            polygon([[0, 0], [1, 0], [2, 0]]),
            polygon([[0, 0], [2, 0], [2, 2], [0, 0]]),
            polygon([[0, 0], [2, 2], [0, 2], [2, 0]]),
            polygon([[0, 0], [3, 0], [3, 3], [1, 0], [0, 3]]),
            polygon([[0, 0], [3, 0], [1, 0], [1, 2], [0, 2]]),
            polygon([[0, 0], [3, 0], [3, 2], [1, 2], [1, 0]]),
            polygon([[0, 0], [1, 0], [1, 2], [3, 2], [3, 0]]),
            polygon([[0, 0], [0, 3], [2, 3], [2, 1], [0, 1], [0, 2], [3, 2], [3, 0]])
        ];
        for (const points of invalid) {
            expect(isSimpleCoordinatePolygon(points)).toBe(false);
            expect(isSimpleCoordinatePolygon([...points].reverse())).toBe(false);
        }
        for (const value of [null, undefined, {}, [], [vertex(0, 0)], new Array(3), [vertex(0, 0), vertex(1, 1), {}]]) {
            expect(isSimpleCoordinatePolygon(value)).toBe(false);
        }
    });
});
