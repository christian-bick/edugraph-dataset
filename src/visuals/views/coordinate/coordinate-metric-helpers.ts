import type {CoordinateAlignedSeparation, CoordinateAxisDistanceProblem, CoordinateMetricContext, CoordinatePolygonProblem, CoordinateRouteProblem, RationalCoordinateAxes, RationalCoordinatePoint, SignedRational} from '../../../types/problems.ts';
import {isCoordinatePoints, isCoordinateScalar, isRationalCoordinateAxis} from './rational-coordinate-helpers.ts';

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
const equal = (a: SignedRational, b: SignedRational) => a.numerator === b.numerator && a.denominator === b.denominator;
const comparison = (a: SignedRational, b: SignedRational) => {
    const result = BigInt(a.numerator) * BigInt(b.denominator) - BigInt(b.numerator) * BigInt(a.denominator);
    return result < 0n ? -1 : result > 0n ? 1 : 0;
};
const difference = (a: SignedRational, b: SignedRational, result: SignedRational) =>
    (BigInt(a.numerator) * BigInt(b.denominator) - BigInt(b.numerator) * BigInt(a.denominator)) * BigInt(result.denominator) === BigInt(result.numerator) * BigInt(a.denominator) * BigInt(b.denominator);
const sum = (a: SignedRational, b: SignedRational, result: SignedRational) =>
    (BigInt(a.numerator) * BigInt(b.denominator) + BigInt(b.numerator) * BigInt(a.denominator)) * BigInt(result.denominator) === BigInt(result.numerator) * BigInt(a.denominator) * BigInt(b.denominator);
const frame = (value: unknown): value is RationalCoordinateAxes => record(value) && isRationalCoordinateAxis(value.x) && isRationalCoordinateAxis(value.y);
function points(axes: RationalCoordinateAxes, value: unknown): value is RationalCoordinatePoint[] {
    return isCoordinatePoints({kind: 'coordinate-points', axes, points: value});
}
function context(value: unknown, locations: readonly RationalCoordinatePoint[]): value is CoordinateMetricContext {
    if (!record(value) || value.kind !== 'survey-map' || value.reference !== 'survey-origin' || value.lengthUnit !== 'meters' || value.positiveX !== 'east' || value.positiveY !== 'north' ||
        !Array.isArray(value.landmarks) || value.landmarks.length !== locations.length) return false;
    const remaining = new Set(locations.map(point => point.id));
    return Array.from(value.landmarks).every(landmark => {
        if (!record(landmark) || typeof landmark.pointId !== 'string' || !remaining.delete(landmark.pointId) || typeof landmark.role !== 'string' || !['entrance', 'bench', 'fountain', 'tree', 'corner'].includes(landmark.role)) return false;
        return true;
    }) && remaining.size === 0;
}
function separation(value: unknown, from: RationalCoordinatePoint, to: RationalCoordinatePoint): value is CoordinateAlignedSeparation {
    if (!record(value) || value.fromId !== from.id || value.toId !== to.id || (value.varyingAxis !== 'x' && value.varyingAxis !== 'y')) return false;
    const varying = value.varyingAxis, fixed = varying === 'x' ? 'y' : 'x';
    if (!equal(from[fixed].value, to[fixed].value) || !isCoordinateScalar(value.fixedCoordinate) || !equal(value.fixedCoordinate, from[fixed].value) ||
        !isCoordinateScalar(value.fromCoordinate) || !equal(value.fromCoordinate, from[varying].value) || !isCoordinateScalar(value.toCoordinate) || !equal(value.toCoordinate, to[varying].value) ||
        !isCoordinateScalar(value.lower) || !isCoordinateScalar(value.upper) || !isCoordinateScalar(value.orderedDifference) || !isCoordinateScalar(value.distance) || value.distance.numerator < 0) return false;
    const direction = comparison(from[varying].value, to[varying].value);
    return value.direction === (direction < 0 ? 'increasing' : direction > 0 ? 'decreasing' : 'stationary') &&
        equal(value.lower, direction <= 0 ? from[varying].value : to[varying].value) && equal(value.upper, direction <= 0 ? to[varying].value : from[varying].value) &&
        difference(value.upper, value.lower, value.orderedDifference) && equal(value.orderedDifference, value.distance);
}
export function isCoordinateAxisDistance(value: unknown): value is CoordinateAxisDistanceProblem {
    if (!record(value) || value.kind !== 'coordinate-axis-distance' || !frame(value.axes) || !points(value.axes, [value.first, value.second])) return false;
    const locations = [value.first, value.second] as RationalCoordinatePoint[];
    const [first, second] = locations as [RationalCoordinatePoint, RationalCoordinatePoint];
    if (!context(value.context, locations) || !separation(value.separation, first, second) || !record(value.absoluteDifference)) return false;
    const absolute = value.absoluteDifference, relation = value.separation;
    return isCoordinateScalar(absolute.minuend) && isCoordinateScalar(absolute.subtrahend) && isCoordinateScalar(absolute.difference) && isCoordinateScalar(absolute.magnitude) &&
        ((equal(absolute.minuend, relation.fromCoordinate) && equal(absolute.subtrahend, relation.toCoordinate)) || (equal(absolute.minuend, relation.toCoordinate) && equal(absolute.subtrahend, relation.fromCoordinate))) &&
        difference(absolute.minuend, absolute.subtrahend, absolute.difference) && equal(absolute.magnitude, relation.distance) &&
        absolute.magnitude.numerator === Math.abs(absolute.difference.numerator) && absolute.magnitude.denominator === absolute.difference.denominator;
}
export function isCoordinateRoute(value: unknown): value is CoordinateRouteProblem {
    if (!record(value) || value.kind !== 'coordinate-problems' || !frame(value.axes) || !points(value.axes, value.landmarks) || value.landmarks.length < 2 || !context(value.context, value.landmarks) ||
        !Array.isArray(value.path) || value.path.length < 2 || !Array.isArray(value.legs) || value.legs.length !== value.path.length - 1 || !Array.isArray(value.cumulativeLengths) || value.cumulativeLengths.length !== value.legs.length + 1 ||
        !Array.from(value.cumulativeLengths).every(item => isCoordinateScalar(item) && item.numerator >= 0) || !isCoordinateScalar(value.totalLength) || value.totalLength.numerator < 0) return false;
    const lookup = new Map(value.landmarks.map(point => [point.id, point]));
    if (!Array.from(value.path).every(id => typeof id === 'string' && lookup.has(id))) return false;
    const path: string[] = value.path, prefixes: SignedRational[] = value.cumulativeLengths;
    if (prefixes[0]!.numerator !== 0 || !equal(prefixes.at(-1)!, value.totalLength)) return false;
    return Array.from(value.legs).every((leg, index) => separation(leg, lookup.get(path[index]!)!, lookup.get(path[index + 1]!)!) && sum(prefixes[index]!, leg.distance, prefixes[index + 1]!));
}

type Point = RationalCoordinatePoint;
const delta = (a: SignedRational, b: SignedRational) => [BigInt(b.numerator) * BigInt(a.denominator) - BigInt(a.numerator) * BigInt(b.denominator), BigInt(a.denominator) * BigInt(b.denominator)] as const;
function orientation(a: Point, b: Point, c: Point): bigint {
    const [bx, bxd] = delta(a.x.value, b.x.value), [by, byd] = delta(a.y.value, b.y.value);
    const [cx, cxd] = delta(a.x.value, c.x.value), [cy, cyd] = delta(a.y.value, c.y.value);
    return bx * cy * byd * cxd - by * cx * bxd * cyd;
}
const samePosition = (a: Point, b: Point) => equal(a.x.value, b.x.value) && equal(a.y.value, b.y.value);
function onSegment(a: Point, b: Point, c: Point): boolean {
    return orientation(a, b, c) === 0n && (['x', 'y'] as const).every(axis => comparison(c[axis].value, a[axis].value) * comparison(c[axis].value, b[axis].value) <= 0);
}
function intersects(a: Point, b: Point, c: Point, d: Point): boolean {
    const abC = orientation(a, b, c), abD = orientation(a, b, d), cdA = orientation(c, d, a), cdB = orientation(c, d, b);
    return (abC < 0n && abD > 0n || abC > 0n && abD < 0n) && (cdA < 0n && cdB > 0n || cdA > 0n && cdB < 0n) ||
        abC === 0n && onSegment(a, b, c) || abD === 0n && onSegment(a, b, d) || cdA === 0n && onSegment(c, d, a) || cdB === 0n && onSegment(c, d, b);
}
function simpleBoundary(vertices: readonly Point[]): boolean {
    const count = vertices.length;
    if (!vertices.slice(1, -1).some((point, index) => orientation(vertices[0]!, point, vertices[index + 2]!) !== 0n)) return false;
    for (let i = 0; i < count; i++) {
        const a = vertices[i]!, b = vertices[(i + 1) % count]!, previous = vertices[(i + count - 1) % count]!;
        if (vertices.slice(i + 1).some(point => samePosition(a, point)) || orientation(previous, a, b) === 0n && !onSegment(previous, b, a)) return false;
        for (let j = i + 1; j < count; j++) {
            if (j === i + 1 || i === 0 && j === count - 1) continue;
            if (intersects(a, b, vertices[j]!, vertices[(j + 1) % count]!)) return false;
        }
    }
    return true;
}
export function isCoordinatePolygon(value: unknown): value is CoordinatePolygonProblem {
    if (!record(value) || value.kind !== 'coordinate-polygons' || !frame(value.axes) || !points(value.axes, value.vertices) || value.vertices.length < 3 || !context(value.context, value.vertices) || !simpleBoundary(value.vertices) ||
        !Array.isArray(value.edges) || value.edges.length !== value.vertices.length || !Array.isArray(value.alignedSides) || value.alignedSides.length === 0 || !Array.isArray(value.sideDistanceEquations)) return false;
    const vertices = value.vertices;
    if (!Array.from(value.edges).every((edge, index) => record(edge) && edge.fromId === vertices[index]!.id && edge.toId === vertices[(index + 1) % vertices.length]!.id)) return false;
    const aligned = vertices.flatMap((point, index) => equal(point.x.value, vertices[(index + 1) % vertices.length]!.x.value) || equal(point.y.value, vertices[(index + 1) % vertices.length]!.y.value) ? [index] : []);
    if (aligned.length !== value.alignedSides.length) return false;
    const relations = new Map<number, CoordinateAlignedSeparation>();
    if (!Array.from(value.alignedSides).every((side, index) => {
        if (!record(side) || !integer(side.edgeIndex) || side.edgeIndex !== aligned[index] || !separation(side.separation, vertices[side.edgeIndex]!, vertices[(side.edgeIndex + 1) % vertices.length]!)) return false;
        relations.set(side.edgeIndex, side.separation);
        return true;
    })) return false;
    let previous = -1;
    return Array.from(value.sideDistanceEquations).every(equation => {
        if (!record(equation) || !integer(equation.edgeIndex) || equation.edgeIndex <= previous || !isCoordinateScalar(equation.minuend) || !isCoordinateScalar(equation.subtrahend) || !isCoordinateScalar(equation.difference)) return false;
        const relation = relations.get(equation.edgeIndex);
        if (!relation || !equal(equation.minuend, relation.upper) || !equal(equation.subtrahend, relation.lower) || !equal(equation.difference, relation.distance)) return false;
        previous = equation.edgeIndex;
        return true;
    });
}
