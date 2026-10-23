import {GeneratorValidationError} from '../../lib/errors.ts';
import type {NetFaceEdge, NetFaceFold, NetFaceMeasure, NetPlanarFace, NetPoint2, NetPoint3,
    NetProperRotation, NetScalar, NetSolidEdge, NetSolidFace, PolyhedralNetProblem} from '../../types/problems.ts';
import {affineCoefficientArithmetic, affineScalar} from '../algebra/algebra-affine-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';

export type NetFaceGeometry = Omit<NetPlanarFace, 'measure'>;
export type PolyhedralNetGeometryInput = Readonly<{
    solidKind: PolyhedralNetProblem['solidKind'];
    solid: Readonly<{vertices: PolyhedralNetProblem['solid']['vertices']; faces: PolyhedralNetProblem['solid']['faces']}>;
    planarFaces: readonly [NetFaceGeometry, ...NetFaceGeometry[]];
    hingeEdges: readonly [NetFaceEdge, ...NetFaceEdge[]];
}>;
export type PolyhedralNetGeometry = Readonly<{
    solidKind: PolyhedralNetProblem['solidKind']; solid: PolyhedralNetProblem['solid'];
    net: Readonly<{faces: readonly [NetFaceGeometry, ...NetFaceGeometry[]]; hinges: PolyhedralNetProblem['net']['hinges'];
        cutSeams: PolyhedralNetProblem['net']['cutSeams']; folds: PolyhedralNetProblem['net']['folds']}>;
}>;

const fail = (message = 'Expected a coherent exact convex solid, nonoverlapping net and proper folds.'): never => {
    throw new GeneratorValidationError('polyhedral-nets', message);
};
const require: (condition: unknown, message?: string) => asserts condition = (condition, message) => {if (!condition) fail(message);};
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const text = (value: unknown): value is string => typeof value === 'string' && value.trim() === value && value.length > 0;
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
function dense(value: unknown, count: number): value is unknown[] {
    if (!Array.isArray(value) || value.length !== count) return false;
    for (let index = 0; index < count; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
}
const point2 = (value: unknown): value is NetPoint2 => record(value) && isCanonicalSignedRational(value.x) && isCanonicalSignedRational(value.y);
const point3 = (value: unknown): value is NetPoint3 => record(value) && isCanonicalSignedRational(value.x) && isCanonicalSignedRational(value.y) && isCanonicalSignedRational(value.z);
function checked<T>(body: () => T): T {
    try {return body();} catch (error) {
        if (error instanceof GeneratorValidationError && error.message.startsWith('[Generator: polyhedral-nets]')) throw error;
        return fail();
    }
}
const tuple = <T>(rows: readonly T[]): readonly [T, ...T[]] => {const [first, ...rest] = rows; require(first !== undefined); return [first, ...rest];};

// All unrendered determinants, intersections and squared quantities stay wide.
// Only a field that actually belongs in the public proof is converted to a scalar.
type W = {n: bigint; d: bigint};
type V2 = readonly [W, W];
type V3 = readonly [W, W, W];
const zero: W = {n: 0n, d: 1n}, one: W = {n: 1n, d: 1n};
const w = (value: NetScalar): W => ({n: BigInt(value.numerator), d: BigInt(value.denominator)});
function rational(n: bigint, d: bigint): W {
    require(d !== 0n); if (d < 0n) {n = -n; d = -d;}
    let a = n < 0n ? -n : n, b = d;
    while (b !== 0n) [a, b] = [b, a % b];
    return {n: n / a, d: d / a};
}
const add = (a: W, b: W) => rational(a.n * b.d + b.n * a.d, a.d * b.d);
const sub = (a: W, b: W) => rational(a.n * b.d - b.n * a.d, a.d * b.d);
const mul = (a: W, b: W) => rational(a.n * b.n, a.d * b.d);
const div = (a: W, b: W) => rational(a.n * b.d, a.d * b.n);
const sign = (a: W) => a.n < 0n ? -1 : a.n > 0n ? 1 : 0;
const compare = (a: W, b: W) => sign(sub(a, b));
const equal = (a: W, b: W) => compare(a, b) === 0;
const scalar = (value: W): NetScalar => affineScalar(value.n, value.d);
const p2 = (p: NetPoint2): V2 => [w(p.x), w(p.y)];
const p3 = (p: NetPoint3): V3 => [w(p.x), w(p.y), w(p.z)];
const v2sub = (a: V2, b: V2): V2 => [sub(a[0], b[0]), sub(a[1], b[1])];
const v3sub = (a: V3, b: V3): V3 => [sub(a[0], b[0]), sub(a[1], b[1]), sub(a[2], b[2])];
const v3add = (a: V3, b: V3): V3 => [add(a[0], b[0]), add(a[1], b[1]), add(a[2], b[2])];
const scale = (a: V3, b: W): V3 => [mul(a[0], b), mul(a[1], b), mul(a[2], b)];
const dot2 = (a: V2, b: V2) => add(mul(a[0], b[0]), mul(a[1], b[1]));
const cross2 = (a: V2, b: V2) => sub(mul(a[0], b[1]), mul(a[1], b[0]));
const dot = (a: V3, b: V3) => add(add(mul(a[0], b[0]), mul(a[1], b[1])), mul(a[2], b[2]));
const cross = (a: V3, b: V3): V3 => [sub(mul(a[1], b[2]), mul(a[2], b[1])), sub(mul(a[2], b[0]), mul(a[0], b[2])), sub(mul(a[0], b[1]), mul(a[1], b[0]))];
const equal3 = (a: V3, b: V3) => a.every((component, index) => equal(component, b[index]!));
const equal2 = (a: V2, b: V2) => a.every((component, index) => equal(component, b[index]!));
const key3 = (a: V3) => a.map(value => `${value.n}/${value.d}`).join(',');
const key2 = (a: V2) => a.map(value => `${value.n}/${value.d}`).join(',');
const stored3 = (a: V3): NetPoint3 => ({x: scalar(a[0]), y: scalar(a[1]), z: scalar(a[2])});
const stored2 = (a: V2): NetPoint2 => ({x: scalar(a[0]), y: scalar(a[1])});
const nextEdges = <T>(vertices: readonly T[]) => vertices.map((p, i) => [p, vertices[(i + 1) % vertices.length]!] as const);
const edgeKey = (a: string, b: string) => JSON.stringify([a, b].sort());
const incidenceKey = (i: NetFaceEdge) => JSON.stringify([i.faceId, i.edgeIndex]);
const cyclic = (first: readonly string[], second: readonly string[]) => first.length === second.length && first.some((_id, shift) => first.every((id, index) => id === second[(index + shift) % second.length]));
function polygon2(points: readonly V2[]): number {
    require(points.length === 3 || points.length === 4);
    require(new Set(points.map(key2)).size === points.length);
    const turns = points.map((p, index) => sign(cross2(v2sub(points[(index + 1) % points.length]!, p), v2sub(points[(index + 2) % points.length]!, points[(index + 1) % points.length]!))));
    require(turns[0] !== 0 && turns.every(turn => turn === turns[0]));
    if (points.length === 4) {
        const [a, b, c, d] = points as readonly [V2, V2, V2, V2];
        require(equal2(v2sub(b, a), v2sub(c, d)) && equal2(v2sub(c, b), v2sub(d, a)) && sign(dot2(v2sub(b, a), v2sub(c, b))) === 0);
    }
    return turns[0]!;
}
/** Convex SAT admits boundary contacts but never overlapping face interiors. */
function disjoint2(first: readonly V2[], second: readonly V2[]): boolean {
    for (const [a, b] of [...nextEdges(first), ...nextEdges(second)]) {
        const direction = v2sub(b, a), project = (p: V2) => cross2(direction, v2sub(p, a));
        const values1 = first.map(project), values2 = second.map(project);
        const min = (values: W[]) => values.reduce((a, b) => compare(a, b) < 0 ? a : b);
        const max = (values: W[]) => values.reduce((a, b) => compare(a, b) > 0 ? a : b);
        if (compare(max(values1), min(values2)) <= 0 || compare(max(values2), min(values1)) <= 0) return true;
    }
    return false;
}
type SourceFace = {face: NetSolidFace; points: V3[]; normal: V3};
type SourceEdge = {ids: readonly [string, string]; incidences: NetFaceEdge[]; square: W};
type Source = {vertices: Map<string, V3>; faces: SourceFace[]; edges: Map<string, SourceEdge>};
const dimensions = {
    'rectangular-prism': {vertices: 8, faces: 6, edges: 12},
    'triangular-prism': {vertices: 6, faces: 5, edges: 9},
    'triangular-pyramid': {vertices: 4, faces: 4, edges: 6},
    'rectangular-pyramid': {vertices: 5, faces: 5, edges: 8}
} as const;
function knownKind(kind: unknown): kind is PolyhedralNetProblem['solidKind'] {return typeof kind === 'string' && Object.hasOwn(dimensions, kind);}
function connected(ids: readonly string[], pairs: readonly (readonly [string, string])[]): boolean {
    const visited = new Set([ids[0]!]);
    for (let changed = true; changed;) {changed = false; for (const [a, b] of pairs) if (visited.has(a) || visited.has(b)) {if (!visited.has(a) || !visited.has(b)) changed = true; visited.add(a); visited.add(b);}}
    return visited.size === ids.length;
}
function insideFace(p: V3, face: SourceFace): boolean {
    return sign(dot(face.normal, v3sub(p, face.points[0]!))) === 0
        && nextEdges(face.points).every(([a, b]) => sign(dot(cross(v3sub(b, a), v3sub(p, a)), face.normal)) >= 0);
}
function onSegment3(p: V3, a: V3, b: V3): boolean {
    const direction = v3sub(b, a), offset = v3sub(p, a);
    return sign(dot(cross(direction, offset), cross(direction, offset))) === 0 && sign(dot(offset, v3sub(p, b))) <= 0;
}
/** Supporting planes do not alone prove embedding: inspect every pair's actual intersection. */
function sourceFacesMeetOnlyOnNamedBoundary(first: SourceFace, second: SourceFace, vertices: Map<string, V3>): boolean {
    const shared = first.face.vertexIds.filter(id => second.face.vertexIds.includes(id));
    if (shared.length > 2) return false;
    if (shared.length === 2 && (![first, second].every(face => nextEdges(face.face.vertexIds).some(([a, b]) => edgeKey(a, b) === edgeKey(shared[0]!, shared[1]!))))) return false;
    const parallel = cross(first.normal, second.normal);
    if (sign(dot(parallel, parallel)) === 0 && sign(dot(first.normal, v3sub(second.points[0]!, first.points[0]!))) === 0) {
        const drop = first.normal.findIndex(component => sign(component) !== 0);
        const project = (p: V3): V2 => {const kept = p.filter((_value, index) => index !== drop); return [kept[0]!, kept[1]!];};
        if (!disjoint2(first.points.map(project), second.points.map(project))) return false;
    }
    const allowed = (p: V3) => shared.length === 1 ? equal3(p, vertices.get(shared[0]!)!)
        : shared.length === 2 && onSegment3(p, vertices.get(shared[0]!)!, vertices.get(shared[1]!)!);
    for (const [from, into] of [[first, second], [second, first]] as const) for (const [a, b] of nextEdges(from.points)) {
        const da = dot(into.normal, v3sub(a, into.points[0]!)), db = dot(into.normal, v3sub(b, into.points[0]!));
        if (sign(da) === 0 && insideFace(a, into) && !allowed(a)) return false;
        if (sign(db) === 0 && insideFace(b, into) && !allowed(b)) return false;
        if (sign(da) * sign(db) < 0) {
            const p = v3add(a, scale(v3sub(b, a), div(da, sub(da, db))));
            if (insideFace(p, into) && !allowed(p)) return false;
        }
    }
    return true;
}
function classify(kind: PolyhedralNetProblem['solidKind'], source: Source): void {
    const triangles = source.faces.filter(f => f.face.shape === 'triangle'), rectangles = source.faces.filter(f => f.face.shape === 'rectangle');
    if (kind === 'triangular-pyramid') {require(triangles.length === 4); return;}
    if (kind === 'rectangular-prism') {
        require(rectangles.length === 6);
        for (const [id, p] of source.vertices) {
            const neighbors = [...source.edges.values()].filter(e => e.ids.includes(id)).map(e => source.vertices.get(e.ids[0] === id ? e.ids[1] : e.ids[0])!);
            require(neighbors.length === 3);
            for (let a = 0; a < 3; a++) for (let b = a + 1; b < 3; b++) require(sign(dot(v3sub(neighbors[a]!, p), v3sub(neighbors[b]!, p))) === 0);
        }
        return;
    }
    if (kind === 'rectangular-pyramid') {
        require(rectangles.length === 1 && triangles.length === 4);
        const base = rectangles[0]!.face.vertexIds, apex = [...source.vertices.keys()].filter(id => !base.includes(id));
        require(apex.length === 1 && triangles.every(face => face.face.vertexIds.includes(apex[0]!) && face.face.vertexIds.filter(id => base.includes(id)).length === 2));
        return;
    }
    require(triangles.length === 2 && rectangles.length === 3);
    const a = triangles[0]!, b = triangles[1]!;
    require(a.face.vertexIds.every(id => !b.face.vertexIds.includes(id)) && sign(dot(cross(a.normal, b.normal), cross(a.normal, b.normal))) === 0 && sign(dot(a.normal, b.normal)) < 0);
    const matches = b.points.map(p => v3sub(p, a.points[0]!)).filter(translation => a.points.every(p => b.points.some(q => equal3(v3add(p, translation), q))));
    require(matches.length === 1);
    const translation = matches[0]!;
    for (const face of rectangles) {
        const first = face.face.vertexIds.filter(id => a.face.vertexIds.includes(id));
        require(first.length === 2 && first.every(id => face.points.some(p => equal3(p, v3add(source.vertices.get(id)!, translation)))));
    }
}
function readSource(kind: unknown, value: unknown): Source {
    require(knownKind(kind) && record(value)); const expected = dimensions[kind];
    require(dense(value.vertices, expected.vertices) && dense(value.faces, expected.faces));
    const vertices = new Map<string, V3>(), positions = new Set<string>();
    for (const row of value.vertices) {require(record(row) && text(row.vertexId) && point3(row.point) && !vertices.has(row.vertexId)); const p = p3(row.point); require(!positions.has(key3(p))); positions.add(key3(p)); vertices.set(row.vertexId, p);}
    const ids = new Set<string>(), used = new Set<string>(), edges = new Map<string, SourceEdge>();
    const faces: SourceFace[] = value.faces.map(raw => {
        require(record(raw) && text(raw.faceId) && !ids.has(raw.faceId) && (raw.shape === 'triangle' || raw.shape === 'rectangle') && dense(raw.vertexIds, raw.shape === 'triangle' ? 3 : 4));
        ids.add(raw.faceId); const faceId = raw.faceId, cycle = raw.vertexIds;
        require(cycle.every(text) && new Set(cycle).size === cycle.length && cycle.every(id => vertices.has(id)));
        const points = cycle.map(id => {used.add(id); return vertices.get(id)!;}), normal = cross(v3sub(points[1]!, points[0]!), v3sub(points[2]!, points[0]!));
        require(sign(dot(normal, normal)) > 0 && points.every(p => sign(dot(normal, v3sub(p, points[0]!))) === 0));
        if (points.length === 4) require(equal3(v3sub(points[1]!, points[0]!), v3sub(points[2]!, points[3]!)) && equal3(v3sub(points[2]!, points[1]!), v3sub(points[3]!, points[0]!)) && sign(dot(v3sub(points[1]!, points[0]!), v3sub(points[2]!, points[1]!))) === 0);
        const distances = [...vertices.values()].map(p => sign(dot(normal, v3sub(p, points[0]!))));
        require(distances.every(distance => distance <= 0) && distances.some(distance => distance < 0), 'Faces must be outward supporting planes of a full-dimensional convex solid.');
        nextEdges(cycle).forEach(([a, b], edgeIndex) => {const key = edgeKey(a, b), delta = v3sub(vertices.get(b)!, vertices.get(a)!); const row = edges.get(key) ?? {ids: [a, b] as const, incidences: [], square: dot(delta, delta)}; row.incidences.push({faceId, edgeIndex}); edges.set(key, row);});
        const face: NetSolidFace = raw.shape === 'triangle' ? {faceId: raw.faceId, shape: 'triangle', vertexIds: [cycle[0]!, cycle[1]!, cycle[2]!]}
            : {faceId: raw.faceId, shape: 'rectangle', vertexIds: [cycle[0]!, cycle[1]!, cycle[2]!, cycle[3]!]};
        return {face, points, normal};
    });
    require(used.size === vertices.size && edges.size === expected.edges && vertices.size - edges.size + faces.length === 2);
    for (const edge of edges.values()) {
        require(edge.incidences.length === 2 && edge.incidences[0]!.faceId !== edge.incidences[1]!.faceId);
        const directed = edge.incidences.map(i => {const cycle = faces.find(f => f.face.faceId === i.faceId)!.face.vertexIds; return [cycle[i.edgeIndex]!, cycle[(i.edgeIndex + 1) % cycle.length]!] as const;});
        require(directed[0]![0] === directed[1]![1] && directed[0]![1] === directed[1]![0]);
    }
    require(connected(faces.map(f => f.face.faceId), [...edges.values()].map(e => [e.incidences[0]!.faceId, e.incidences[1]!.faceId])));
    for (let a = 0; a < faces.length; a++) for (let b = a + 1; b < faces.length; b++) require(sourceFacesMeetOnlyOnNamedBoundary(faces[a]!, faces[b]!, vertices));
    const source = {vertices, faces, edges}; classify(kind, source); return source;
}
function readFaces(value: unknown, source: Source): NetFaceGeometry[] {
    require(dense(value, source.faces.length)); const seen = new Set<string>(); let orientation = 0;
    const faces = value.map(raw => {
        require(record(raw) && text(raw.faceId) && !seen.has(raw.faceId)); seen.add(raw.faceId);
        const sourceFace = source.faces.find(f => f.face.faceId === raw.faceId); require(sourceFace && dense(raw.vertices, sourceFace.points.length));
        const vertices = raw.vertices.map(row => {require(record(row) && text(row.solidVertexId) && point2(row.point)); return {solidVertexId: row.solidVertexId, point: {x: {...row.point.x}, y: {...row.point.y}}};});
        require(cyclic(sourceFace.face.vertexIds, vertices.map(v => v.solidVertexId)));
        const winding = polygon2(vertices.map(v => p2(v.point))); if (orientation === 0) orientation = winding; require(orientation === winding, 'One coherent sheet winding is required.');
        const face: NetFaceGeometry = {faceId: raw.faceId, vertices: [vertices[0]!, vertices[1]!, vertices[2]!, ...vertices.slice(3)]};
        return face;
    });
    for (let a = 0; a < faces.length; a++) for (let b = a + 1; b < faces.length; b++) require(disjoint2(faces[a]!.vertices.map(v => p2(v.point)), faces[b]!.vertices.map(v => p2(v.point))), 'Net face interiors overlap.');
    return faces;
}
function deriveFold(face: NetFaceGeometry, source: Source): NetFaceFold {
    const [a, b, c] = face.vertices, pa = p2(a.point), db = v2sub(p2(b.point), pa), dc = v2sub(p2(c.point), pa);
    const A = source.vertices.get(a.solidVertexId)!, B = v3sub(source.vertices.get(b.solidVertexId)!, A), C = v3sub(source.vertices.get(c.solidVertexId)!, A), determinant = cross2(db, dc);
    require(sign(determinant) !== 0);
    const col1 = scale(v3sub(scale(B, dc[1]), scale(C, db[1])), div(one, determinant));
    const col2 = scale(v3sub(scale(C, db[0]), scale(B, dc[0])), div(one, determinant));
    require(equal(dot(col1, col1), one) && equal(dot(col2, col2), one) && equal(dot(col1, col2), zero), 'Named source/net faces must be congruent.');
    const col3 = cross(col1, col2), translation = v3sub(v3sub(A, scale(col1, pa[0])), scale(col2, pa[1]));
    const rotation: NetProperRotation = [[scalar(col1[0]), scalar(col2[0]), scalar(col3[0])], [scalar(col1[1]), scalar(col2[1]), scalar(col3[1])], [scalar(col1[2]), scalar(col2[2]), scalar(col3[2])]];
    const fold = {faceId: face.faceId, rotation, translation: stored3(translation)};
    require(validFold(fold, face, source)); return fold;
}
function validFold(value: unknown, face: NetFaceGeometry, source: Source): value is NetFaceFold {
    const rotation = (value: unknown): value is NetProperRotation => dense(value, 3) && value.every(row => dense(row, 3) && row.every(isCanonicalSignedRational));
    if (!record(value) || value.faceId !== face.faceId || !rotation(value.rotation) || !point3(value.translation)) return false;
    const rows = value.rotation;
    const columns: V3[] = [0, 1, 2].map(column => [w(rows[0][column]!), w(rows[1][column]!), w(rows[2][column]!)]);
    for (let a = 0; a < 3; a++) for (let b = a; b < 3; b++) if (!equal(dot(columns[a]!, columns[b]!), a === b ? one : zero)) return false;
    if (!equal(dot(cross(columns[0]!, columns[1]!), columns[2]!), one)) return false;
    return face.vertices.every(v => equal3(v3add(v3add(scale(columns[0]!, w(v.point.x)), scale(columns[1]!, w(v.point.y))), p3(value.translation as NetPoint3)), source.vertices.get(v.solidVertexId)!));
}
function pairMatches(value: unknown, edge: NetSolidEdge): boolean {
    return record(value) && value.solidEdgeId === edge.edgeId && dense(value.incidences, 2) && value.incidences.every(i => record(i) && text(i.faceId) && integer(i.edgeIndex))
        && new Set(value.incidences.map(i => incidenceKey(i as NetFaceEdge))).size === 2 && value.incidences.every(i => edge.incidences.some(e => incidenceKey(e) === incidenceKey(i as NetFaceEdge)));
}
function netTopology(hinges: unknown, cuts: unknown, edges: readonly NetSolidEdge[], faces: readonly NetFaceGeometry[]): void {
    require(dense(hinges, faces.length - 1) && dense(cuts, edges.length - faces.length + 1));
    const selected = new Set<string>(), links: (readonly [string, string])[] = [];
    for (const [rows, isHinge] of [[hinges, true], [cuts, false]] as const) for (const raw of rows) {
        require(record(raw) && text(raw.solidEdgeId) && !selected.has(raw.solidEdgeId)); const edge = edges.find(edge => edge.edgeId === raw.solidEdgeId); require(edge && pairMatches(raw, edge)); selected.add(edge.edgeId);
        if (isHinge) {
            const [first, second] = edge.incidences.map(i => faces.find(f => f.faceId === i.faceId)!);
            require(edge.vertexIds.every(id => equal2(p2(first!.vertices.find(v => v.solidVertexId === id)!.point), p2(second!.vertices.find(v => v.solidVertexId === id)!.point))), 'Hinge copies must coincide on the actual sheet.');
            links.push([first!.faceId, second!.faceId]);
        }
    }
    require(selected.size === edges.length && connected(faces.map(f => f.faceId), links), 'Hinges must form a connected tree and cuts its exact complement.');
}
function solidEdges(value: unknown, source: Source): NetSolidEdge[] {
    require(dense(value, source.edges.size)); const seen = new Set<string>(), ids = new Set<string>();
    return value.map(raw => {
        require(record(raw) && text(raw.edgeId) && !ids.has(raw.edgeId) && dense(raw.vertexIds, 2) && raw.vertexIds.every(text) && isCanonicalSignedRational(raw.lengthSquared)); ids.add(raw.edgeId);
        const key = edgeKey(raw.vertexIds[0]!, raw.vertexIds[1]!), expected = source.edges.get(key); require(expected && !seen.has(key) && equal(w(raw.lengthSquared), expected.square)); seen.add(key);
        const edge: NetSolidEdge = {edgeId: raw.edgeId, vertexIds: [raw.vertexIds[0]!, raw.vertexIds[1]!], incidences: [expected.incidences[0]!, expected.incidences[1]!], lengthSquared: {...raw.lengthSquared}};
        require(pairMatches({solidEdgeId: raw.edgeId, incidences: raw.incidences}, edge));
        return edge;
    });
}

export function buildPolyhedralNetGeometry(input: PolyhedralNetGeometryInput): PolyhedralNetGeometry {
    return checked(() => {
        require(record(input)); const source = readSource(input.solidKind, input.solid), faces = readFaces(input.planarFaces, source);
        const edges: NetSolidEdge[] = [...source.edges.values()].map((e, index) => ({edgeId: `edge-${index}`, vertexIds: [...e.ids], incidences: [e.incidences[0]!, e.incidences[1]!], lengthSquared: scalar(e.square)}));
        require(dense(input.hingeEdges, faces.length - 1)); const chosen = new Set<string>();
        for (const incidence of input.hingeEdges) {require(record(incidence) && text(incidence.faceId) && integer(incidence.edgeIndex)); const edge = edges.find(e => e.incidences.some(i => incidenceKey(i) === incidenceKey(incidence))); require(edge && !chosen.has(edge.edgeId)); chosen.add(edge.edgeId);}
        const pair = (edge: NetSolidEdge) => ({solidEdgeId: edge.edgeId, incidences: edge.incidences});
        const hinges = edges.filter(e => chosen.has(e.edgeId)).map(pair), cuts = edges.filter(e => !chosen.has(e.edgeId)).map(pair);
        netTopology(hinges, cuts, edges, faces);
        return {solidKind: input.solidKind, solid: {vertices: tuple([...source.vertices].map(([vertexId, point]) => ({vertexId, point: stored3(point)}))), faces: tuple(source.faces.map(f => f.face)), edges: tuple(edges)},
            net: {faces: tuple(faces), hinges: tuple(hinges), cutSeams: tuple(cuts), folds: tuple(faces.map(face => deriveFold(face, source)))}};
    });
}

/** Independently validate every supplied source/net/fold witness, without builder equality. */
export function isPolyhedralNetGeometry(value: unknown): value is PolyhedralNetGeometry {
    try {
        if (!record(value) || !record(value.solid) || !record(value.net)) return false;
        const source = readSource(value.solidKind, value.solid), edges = solidEdges(value.solid.edges, source), faces = readFaces(value.net.faces, source);
        netTopology(value.net.hinges, value.net.cutSeams, edges, faces);
        if (!dense(value.net.folds, faces.length)) return false;
        const seen = new Set<string>();
        for (const raw of value.net.folds) {if (!record(raw) || !text(raw.faceId) || seen.has(raw.faceId)) return false; const face = faces.find(f => f.faceId === raw.faceId); if (!face || !validFold(raw, face, source)) return false; seen.add(raw.faceId);}
        return true;
    } catch {return false;}
}
function integerRoot(value: bigint): bigint {
    require(value >= 0n); if (value < 2n) return value;
    let root = value, next = (root + 1n) / 2n;
    while (next < root) {root = next; next = (root + value / root) / 2n;}
    return root;
}
function squareRoot(value: W): W {
    require(sign(value) > 0); const n = integerRoot(value.n), d = integerRoot(value.d);
    require(n * n === value.n && d * d === value.d, 'Selected exact base and altitude must have rational lengths.'); return rational(n, d);
}

export function buildNetFaceMeasure(face: NetFaceGeometry, baseEdgeIndex: number, adjacentEdgeIndex?: number): NetFaceMeasure {
    return checked(() => {
        require(record(face) && text(face.faceId) && Array.isArray(face.vertices) && (face.vertices.length === 3 || face.vertices.length === 4) && dense(face.vertices, face.vertices.length));
        const points = face.vertices.map(v => {require(record(v) && text(v.solidVertexId) && point2(v.point)); return p2(v.point);}); polygon2(points);
        require(new Set(face.vertices.map(v => v.solidVertexId)).size === points.length);
        require(integer(baseEdgeIndex) && baseEdgeIndex >= 0 && baseEdgeIndex < points.length);
        const start = points[baseEdgeIndex]!, end = points[(baseEdgeIndex + 1) % points.length]!, direction = v2sub(end, start), length = squareRoot(dot2(direction, direction)), base = scalar(length);
        if (points.length === 4) {
            require(integer(adjacentEdgeIndex) && (adjacentEdgeIndex === (baseEdgeIndex + 1) % 4 || adjacentEdgeIndex === (baseEdgeIndex + 3) % 4));
            const edge = v2sub(points[(adjacentEdgeIndex + 1) % 4]!, points[adjacentEdgeIndex]!), height = scalar(squareRoot(dot2(edge, edge))), areaProduct = affineCoefficientArithmetic('multiplication', base, height);
            return {kind: 'rectangle', baseEdgeIndex, adjacentEdgeIndex, base, height, areaProduct, area: areaProduct.result};
        }
        require(adjacentEdgeIndex === undefined);
        const apexVertexIndex = (baseEdgeIndex + 2) % 3, vector = v2sub(points[apexVertexIndex]!, start), baseSquare = dot2(direction, direction), ratio = div(dot2(vector, direction), baseSquare);
        const foot: V2 = [add(start[0], mul(direction[0], ratio)), add(start[1], mul(direction[1], ratio))];
        const altitude = v2sub(points[apexVertexIndex]!, foot), height = scalar(squareRoot(dot2(altitude, altitude))), baseOffset = scalar(div(dot2(vector, direction), length));
        const baseHeightProduct = affineCoefficientArithmetic('multiplication', base, height), halfAreaProduct = affineCoefficientArithmetic('multiplication', baseHeightProduct.result, {numerator: 1, denominator: 2});
        return {kind: 'triangle', baseEdgeIndex, apexVertexIndex, altitudeFoot: stored2(foot), base, height, baseOffset, baseHeightProduct, halfAreaProduct, area: halfAreaProduct.result};
    });
}
