import {GeneratorValidationError} from '../../lib/errors.ts';
import type {SignedRational} from '../../types/problems.ts';
import {compareSignedRationals, isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';

export type ExactCoordinateVertex = {x: SignedRational; y: SignedRational};
const validVertex = (value: unknown): value is ExactCoordinateVertex => typeof value === 'object' && value !== null
    && !Array.isArray(value) && isCanonicalSignedRational((value as ExactCoordinateVertex).x)
    && isCanonicalSignedRational((value as ExactCoordinateVertex).y);
const key = (point: ExactCoordinateVertex): string => `${point.x.numerator}/${point.x.denominator},${point.y.numerator}/${point.y.denominator}`;
const delta = (to: SignedRational, from: SignedRational) => ({
    numerator: BigInt(to.numerator) * BigInt(from.denominator) - BigInt(from.numerator) * BigInt(to.denominator),
    denominator: BigInt(to.denominator) * BigInt(from.denominator)
});

function orientation(first: ExactCoordinateVertex, second: ExactCoordinateVertex, third: ExactCoordinateVertex): -1 | 0 | 1 {
    const x1 = delta(second.x, first.x), y1 = delta(second.y, first.y);
    const x2 = delta(third.x, first.x), y2 = delta(third.y, first.y);
    const determinant = x1.numerator * y2.numerator * y1.denominator * x2.denominator
        - y1.numerator * x2.numerator * x1.denominator * y2.denominator;
    return determinant < 0n ? -1 : determinant > 0n ? 1 : 0;
}
const between = (value: SignedRational, first: SignedRational, second: SignedRational): boolean =>
    compareSignedRationals(value, first) * compareSignedRationals(value, second) <= 0;
const onSegment = (point: ExactCoordinateVertex, first: ExactCoordinateVertex, second: ExactCoordinateVertex): boolean =>
    orientation(first, second, point) === 0 && between(point.x, first.x, second.x) && between(point.y, first.y, second.y);

function intersects(first: ExactCoordinateVertex, second: ExactCoordinateVertex, third: ExactCoordinateVertex, fourth: ExactCoordinateVertex): boolean {
    const a = orientation(first, second, third), b = orientation(first, second, fourth);
    const c = orientation(third, fourth, first), d = orientation(third, fourth, second);
    return (a * b < 0 && c * d < 0) || onSegment(third, first, second) || onSegment(fourth, first, second)
        || onSegment(first, third, fourth) || onSegment(second, third, fourth);
}

/** Exact sign only; no area or signed numeric cross-product enters a problem payload. */
export function coordinateOrientation(first: ExactCoordinateVertex, second: ExactCoordinateVertex, third: ExactCoordinateVertex): -1 | 0 | 1 {
    if (![first, second, third].every(validVertex)) throw new GeneratorValidationError('coordinate-polygons', 'Canonical exact vertices are required.');
    return orientation(first, second, third);
}

/** Intersection includes proper crossings, touches, degenerate points and collinear overlap. */
export function coordinateSegmentsIntersect(first: ExactCoordinateVertex, second: ExactCoordinateVertex,
    third: ExactCoordinateVertex, fourth: ExactCoordinateVertex): boolean {
    if (![first, second, third, fourth].every(validVertex)) throw new GeneratorValidationError('coordinate-polygons', 'Canonical exact segment endpoints are required.');
    return intersects(first, second, third, fourth);
}

/** Adjacent edges may share only their common endpoint; all other edges must be disjoint. */
export function isSimpleCoordinatePolygon(value: unknown): value is readonly ExactCoordinateVertex[] {
    if (!Array.isArray(value) || value.length < 3 || !Array.from(value).every(validVertex)) return false;
    const vertices: ExactCoordinateVertex[] = value;
    if (new Set(vertices.map(key)).size !== vertices.length
        || vertices.slice(2).every(point => orientation(vertices[0]!, vertices[1]!, point) === 0)) return false;
    for (let first = 0; first < vertices.length; first++) for (let second = first + 1; second < vertices.length; second++) {
        const a = vertices[first]!, b = vertices[(first + 1) % vertices.length]!;
        const c = vertices[second]!, d = vertices[(second + 1) % vertices.length]!;
        if (second === first + 1) {
            if (onSegment(a, b, d) || onSegment(d, a, b)) return false;
        } else if (first === 0 && second === vertices.length - 1) {
            if (onSegment(b, a, c) || onSegment(c, a, b)) return false;
        } else if (intersects(a, b, c, d)) return false;
    }
    return true;
}
