import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicScalar, PolygonAreaBoundary, PolygonAreaCut, PolygonAreaIsometry, PolygonAreaPoint,
    PolygonAreaShapeFacts, PolygonAreaTriangle} from '../../types/problems.ts';
import {affineScalar, compareAffineScalars} from '../algebra/algebra-affine-helpers.ts';
import {isSimpleCoordinatePolygon, type ExactCoordinateVertex as Vertex} from '../coordinate/polygon-geometry-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';

export type PolygonAreaCellBoundary = Pick<PolygonAreaTriangle, 'cellId' | 'vertices'>;
const fail = (): never => {throw new GeneratorValidationError('polygon-area-dissection', 'Expected coherent exact polygon, partition or rigid geometry.');};
const require: (condition: unknown) => asserts condition = condition => {if (!condition) fail();};
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.trim() === value;
const dense = (value: unknown): value is unknown[] => {
    if (!Array.isArray(value)) return false;
    for (let index = 0; index < value.length; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
};
const vertex = (value: unknown): value is Vertex => record(value) && isCanonicalSignedRational(value.x) && isCanonicalSignedRational(value.y);
const key = (point: Vertex) => `${point.x.numerator}/${point.x.denominator},${point.y.numerator}/${point.y.denominator}`;
const lexical = (first: string, second: string) => first < second ? -1 : first > second ? 1 : 0;
function checked<T>(body: () => T): T {
    try {return body();} catch (error) {if (error instanceof GeneratorValidationError) throw error; return fail();}
}

// Geometry predicates may need an UNRENDERED midpoint with a denominator above MAX_SAFE.
// Keep only these determinant/projection intermediates wide; all public scalar outputs
// use the established reduce-before-safe-conversion routine, not a new numeric evaluator.
type Wide = {n: bigint; d: bigint};
type WidePoint = {x: Wide; y: Wide};
const wide = (value: AlgebraicScalar): Wide => ({n: BigInt(value.numerator), d: BigInt(value.denominator)});
const wp = (point: Vertex): WidePoint => ({x: wide(point.x), y: wide(point.y)});
function reduced(n: bigint, d: bigint): Wide {
    let a = n < 0n ? -n : n, b = d;
    while (b !== 0n) [a, b] = [b, a % b];
    return {n: n / a, d: d / a};
}
const add = (a: Wide, b: Wide): Wide => reduced(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: Wide, b: Wide): Wide => reduced(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: Wide, b: Wide): Wide => reduced(a.n * b.n, a.d * b.d);
const div = (a: Wide, b: Wide): Wide => {
    require(b.n !== 0n);
    return b.n > 0n ? reduced(a.n * b.d, a.d * b.n) : reduced(-a.n * b.d, -a.d * b.n);
};
const sign = (value: Wide) => value.n < 0n ? -1 : value.n > 0n ? 1 : 0;
const compare = (a: Wide, b: Wide) => sign(sub(a, b));
const absolute = (value: Wide): Wide => ({n: value.n < 0n ? -value.n : value.n, d: value.d});
const scalar = (value: Wide) => affineScalar(value.n, value.d);
const delta = (to: WidePoint, from: WidePoint): WidePoint => ({x: sub(to.x, from.x), y: sub(to.y, from.y)});
const dot = (a: WidePoint, b: WidePoint) => add(mul(a.x, b.x), mul(a.y, b.y));
const cross = (a: WidePoint, b: WidePoint) => sub(mul(a.x, b.y), mul(a.y, b.x));
const turn = (a: WidePoint, b: WidePoint, c: WidePoint) => sign(cross(delta(b, a), delta(c, a)));
const zero: Wide = {n: 0n, d: 1n}, one: Wide = {n: 1n, d: 1n};
const midpoint = (a: Vertex, b: Vertex): WidePoint => ({x: div(add(wide(a.x), wide(b.x)), {n: 2n, d: 1n}), y: div(add(wide(a.y), wide(b.y)), {n: 2n, d: 1n})});
const edges = <T>(points: readonly T[]) => points.map((point, index) => [point, points[(index + 1) % points.length]!] as const);
function twiceArea(points: readonly Vertex[]): Wide {
    return edges(points).reduce((total, [a, b]) => add(total, cross(wp(a), wp(b))), zero);
}
const area = (points: readonly Vertex[]) => div(absolute(twiceArea(points)), {n: 2n, d: 1n});
function simple(value: unknown): asserts value is readonly Vertex[] {
    require(dense(value) && value.length >= 3 && value.every(vertex) && isSimpleCoordinatePolygon(value));
}
function onSegment(point: WidePoint, a: WidePoint, b: WidePoint): boolean {
    return turn(a, b, point) === 0 && compare(sub(point.x, a.x), zero) * compare(sub(point.x, b.x), zero) <= 0
        && compare(sub(point.y, a.y), zero) * compare(sub(point.y, b.y), zero) <= 0;
}
/** -1 outside,0 on boundary,1 strictly inside; no rational midpoint is rounded. */
function location(point: WidePoint, boundary: readonly Vertex[]): -1 | 0 | 1 {
    let inside = false;
    for (const [first, second] of edges(boundary)) {
        const a = wp(first), b = wp(second);
        if (onSegment(point, a, b)) return 0;
        if ((compare(a.y, point.y) > 0) !== (compare(b.y, point.y) > 0)
            && turn(a, b, point) === compare(b.y, a.y)) inside = !inside;
    }
    return inside ? 1 : -1;
}
function split(a: PolygonAreaPoint, b: PolygonAreaPoint, vertices: readonly PolygonAreaPoint[]): PolygonAreaPoint[] {
    const points = new Map([[key(a), a], [key(b), b]]);
    for (const point of vertices) if (onSegment(wp(point), wp(a), wp(b))) points.set(key(point), point);
    const axis = compareAffineScalars(a.x, b.x) === 0 ? 'y' : 'x';
    return [...points.values()].sort((first, second) => compareAffineScalars(first[axis], second[axis]));
}
function contained(triangle: readonly PolygonAreaPoint[], boundary: readonly PolygonAreaPoint[]): boolean {
    if (triangle.some(point => location(wp(point), boundary) < 0)) return false;
    for (const [a, b] of edges(triangle)) {
        for (const [c, d] of edges(boundary)) {
            if (turn(wp(a), wp(b), wp(c)) * turn(wp(a), wp(b), wp(d)) < 0
                && turn(wp(c), wp(d), wp(a)) * turn(wp(c), wp(d), wp(b)) < 0) return false;
        }
        const parts = split(a, b, boundary);
        for (let index = 1; index < parts.length; index++) if (location(midpoint(parts[index - 1]!, parts[index]!), boundary) < 0) return false;
    }
    const centroid = {x: div(triangle.reduce((sum, point) => add(sum, wide(point.x)), zero), {n: 3n, d: 1n}),
        y: div(triangle.reduce((sum, point) => add(sum, wide(point.y)), zero), {n: 3n, d: 1n})};
    return location(centroid, boundary) > 0;
}
/** Convex separating-axis test: equal projection endpoints allow boundary touches. */
function disjointInteriors(first: readonly PolygonAreaPoint[], second: readonly PolygonAreaPoint[]): boolean {
    for (const [a, b] of [...edges(first), ...edges(second)]) {
        const direction = delta(wp(b), wp(a)), project = (point: Vertex) => cross(direction, delta(wp(point), wp(a)));
        const firstValues = first.map(project), secondValues = second.map(project);
        const minimum = (values: Wide[]) => values.reduce((a, b) => compare(a, b) <= 0 ? a : b);
        const maximum = (values: Wide[]) => values.reduce((a, b) => compare(a, b) >= 0 ? a : b);
        if (compare(maximum(firstValues), minimum(secondValues)) <= 0 || compare(maximum(secondValues), minimum(firstValues)) <= 0) return true;
    }
    return false;
}
function registry(points: unknown): Map<string, PolygonAreaPoint> {
    require(dense(points) && points.length > 0);
    const result = new Map<string, PolygonAreaPoint>();
    for (const point of points) {
        require(record(point)); const id = point.id;
        require(text(id) && vertex(point) && !result.has(id)); result.set(id, {id, x: point.x, y: point.y});
    }
    return result;
}
function resolveBoundary(map: ReadonlyMap<string, PolygonAreaPoint>, ids: unknown): PolygonAreaPoint[] {
    require(dense(ids) && ids.length >= 3 && ids.every(text));
    const result = ids.map(id => {const point = map.get(id); require(point); return point;}); simple(result); return result;
}
function partitionData(points: unknown, boundary: unknown, cells: unknown) {
    const map = registry(points), whole = resolveBoundary(map, boundary);
    require(dense(cells) && cells.length > 0);
    const ids = new Set<string>();
    const triangles = cells.map(cell => {
        require(record(cell) && text(cell.cellId) && !ids.has(cell.cellId) && dense(cell.vertices) && cell.vertices.length === 3);
        ids.add(cell.cellId);
        return {id: cell.cellId, points: resolveBoundary(map, cell.vertices)};
    });
    return {map, whole, triangles};
}
function partition(data: ReturnType<typeof partitionData>): boolean {
    const {whole, triangles} = data;
    if (triangles.some(triangle => !contained(triangle.points, whole))) return false;
    for (let first = 0; first < triangles.length; first++) for (let second = first + 1; second < triangles.length; second++) {
        if (!disjointInteriors(triangles[first]!.points, triangles[second]!.points)) return false;
    }
    return compare(triangles.reduce((sum, triangle) => add(sum, area(triangle.points)), zero), area(whole)) === 0;
}

export function exactPolygonArea(vertices: readonly Vertex[]): AlgebraicScalar {
    return checked(() => {simple(vertices); return scalar(area(vertices));});
}
export function polygonAreaSquaredDistance(first: Vertex, second: Vertex): AlgebraicScalar {
    return checked(() => {require(vertex(first) && vertex(second)); const vector = delta(wp(second), wp(first)); return scalar(dot(vector, vector));});
}
/** A measured length may be safe even when its UNSTORED square is not. */
export function isPolygonAreaSegmentLength(first: Vertex, second: Vertex, length: AlgebraicScalar): boolean {
    try {
        if (!vertex(first) || !vertex(second) || !isCanonicalSignedRational(length) || length.numerator < 0) return false;
        const vector = delta(wp(second), wp(first));
        return compare(dot(vector, vector), mul(wide(length), wide(length))) === 0;
    } catch {return false;}
}
export function projectPolygonAreaHeight(apex: Vertex, baseFirst: Vertex, baseSecond: Vertex) {
    return checked(() => {
        require(vertex(apex) && vertex(baseFirst) && vertex(baseSecond));
        const a = wp(baseFirst), direction = delta(wp(baseSecond), a), vector = delta(wp(apex), a), base = dot(direction, direction);
        require(sign(base) > 0 && turn(a, wp(baseSecond), wp(apex)) !== 0);
        const ratio = div(dot(vector, direction), base), foot = {x: add(a.x, mul(ratio, direction.x)), y: add(a.y, mul(ratio, direction.y))};
        return {foot: {x: scalar(foot.x), y: scalar(foot.y)},
            footLocation: compare(ratio, zero) >= 0 && compare(ratio, one) <= 0 ? 'base-segment' as const : 'base-line-extension' as const,
            area: scalar(div(absolute(cross(direction, vector)), {n: 2n, d: 1n}))};
    });
}
export function buildPolygonAreaShapeFacts(points: readonly PolygonAreaPoint[], boundary: PolygonAreaBoundary): PolygonAreaShapeFacts {
    return checked(() => {
        const vertices = resolveBoundary(registry(points), boundary), orientation = sign(twiceArea(vertices));
        const sides = edges(vertices).map(([a, b], edgeIndex) => ({edgeIndex, fromId: a.id, toId: b.id, squaredLength: polygonAreaSquaredDistance(a, b)}));
        const equalGroups = new Map<string, number[]>();
        for (const side of sides) {const name = `${side.squaredLength.numerator}/${side.squaredLength.denominator}`; const saved = equalGroups.get(name); if (saved) saved.push(side.edgeIndex); else equalGroups.set(name, [side.edgeIndex]);}
        const equalLengthEdgeGroups = [...equalGroups.values()].filter(group => group.length >= 2).map(group => [group[0]!, group[1]!, ...group.slice(2)] as const);
        const angles = vertices.map((point, index) => {
            const previous = vertices[(index + vertices.length - 1) % vertices.length]!, next = vertices[(index + 1) % vertices.length]!;
            const a = delta(wp(previous), wp(point)), b = delta(wp(next), wp(point)), product = dot(a, b), turn = cross(a, b);
            const kind = sign(turn) === 0 ? 'straight' : sign(turn) === orientation ? 'reflex' : sign(product) > 0 ? 'acute' : sign(product) < 0 ? 'obtuse' : 'right';
            return {vertexId: point.id, previousId: previous.id, nextId: next.id, dotProduct: scalar(product), crossProduct: scalar(turn), kind} as const;
        });
        const parallelEdgePairs: PolygonAreaShapeFacts['parallelEdgePairs'][number][] = [];
        const segments = edges(vertices);
        for (let first = 0; first < segments.length; first++) for (let second = first + 1; second < segments.length; second++) {
            const a = segments[first]!, b = segments[second]!;
            const determinant = cross(delta(wp(a[1]), wp(a[0])), delta(wp(b[1]), wp(b[0])));
            if (sign(determinant) === 0) parallelEdgePairs.push({firstEdgeIndex: first, secondEdgeIndex: second});
        }
        return {orientation: orientation > 0 ? 'counterclockwise' : 'clockwise', sides, equalLengthEdgeGroups, angles, parallelEdgePairs};
    });
}
export function isExactTrianglePartition(points: readonly PolygonAreaPoint[], boundary: PolygonAreaBoundary, cells: readonly PolygonAreaCellBoundary[]): boolean {
    try {return partition(partitionData(points, boundary, cells));} catch {return false;}
}
export function buildPolygonAreaCuts(points: readonly PolygonAreaPoint[], boundary: PolygonAreaBoundary, cells: readonly PolygonAreaCellBoundary[]): readonly PolygonAreaCut[] {
    return checked(() => {
        const data = partitionData(points, boundary, cells); require(partition(data));
        const aliases = new Map<string, PolygonAreaPoint>();
        for (const point of data.map.values()) {const saved = aliases.get(key(point)); if (!saved || lexical(point.id, saved.id) < 0) aliases.set(key(point), point);}
        const vertices = [...data.whole, ...data.triangles.flatMap(triangle => triangle.points)];
        const atoms = new Map<string, {from: PolygonAreaPoint; to: PolygonAreaPoint; cells: Set<string>}>();
        for (const triangle of data.triangles) for (const [a, b] of edges(triangle.points)) {
            const parts = split(a, b, vertices);
            for (let index = 1; index < parts.length; index++) {
                const endpoints = [parts[index - 1]!, parts[index]!].sort((a, b) => lexical(key(a), key(b))), atomKey = endpoints.map(key).join('|');
                const saved = atoms.get(atomKey);
                if (saved) saved.cells.add(triangle.id); else atoms.set(atomKey, {from: endpoints[0]!, to: endpoints[1]!, cells: new Set([triangle.id])});
            }
        }
        const cuts: PolygonAreaCut[] = [];
        for (const [, atom] of [...atoms.entries()].sort(([a], [b]) => lexical(a, b))) {
            const middle = midpoint(atom.from, atom.to), outer = edges(data.whole).some(([a, b]) => onSegment(middle, wp(a), wp(b)));
            require(atom.cells.size === (outer ? 1 : 2));
            if (!outer) {const ids = [...atom.cells].sort(lexical); cuts.push({cutId: `cut-${cuts.length + 1}`, fromId: aliases.get(key(atom.from))!.id, toId: aliases.get(key(atom.to))!.id, adjacentCellIds: [ids[0]!, ids[1]!]});}
        }
        return cuts;
    });
}
export function isPolygonAreaIsometry(value: unknown): value is PolygonAreaIsometry {
    try {
        if (!record(value) || !dense(value.matrix) || value.matrix.length !== 2 || !value.matrix.every(row => dense(row) && row.length === 2 && row.every(isCanonicalSignedRational)) || !vertex(value.translation)) return false;
        const [[a, b], [c, d]] = value.matrix as unknown as PolygonAreaIsometry['matrix'];
        return compare(add(mul(wide(a), wide(a)), mul(wide(c), wide(c))), one) === 0
            && compare(add(mul(wide(b), wide(b)), mul(wide(d), wide(d))), one) === 0
            && sign(add(mul(wide(a), wide(b)), mul(wide(c), wide(d)))) === 0
            && compare(absolute(sub(mul(wide(a), wide(d)), mul(wide(b), wide(c)))), one) === 0;
    } catch {return false;}
}
export function transformPolygonAreaPoint(point: Vertex, transform: PolygonAreaIsometry): Vertex {
    return checked(() => {
        require(vertex(point) && isPolygonAreaIsometry(transform));
        const [[a, b], [c, d]] = transform.matrix;
        return {x: scalar(add(add(mul(wide(a), wide(point.x)), mul(wide(b), wide(point.y))), wide(transform.translation.x))),
            y: scalar(add(add(mul(wide(c), wide(point.x)), mul(wide(d), wide(point.y))), wide(transform.translation.y)))};
    });
}
