import type {NetFaceMeasure, NetScalar, PolyhedralNetProblem} from '../../types/problems.ts';
import {affineScalar} from '../algebra/algebra-affine-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import {buildNetFaceMeasure, isPolyhedralNetGeometry, type NetFaceGeometry} from './polyhedral-net-geometry-helpers.ts';

const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
const same = (a: unknown, b: NetScalar): boolean => isCanonicalSignedRational(a) && a.numerator === b.numerator && a.denominator === b.denominator;
function dense(value: unknown, count: number): value is unknown[] {
    if (!Array.isArray(value) || value.length !== count) return false;
    for (let index = 0; index < count; index++) if (!Object.hasOwn(value, index)) return false;
    return true;
}
function arithmetic(value: unknown, operation: 'addition' | 'multiplication' | 'division', a: NetScalar, b: NetScalar, result: NetScalar): boolean {
    if (!record(value) || value.kind !== 'binary' || value.operation !== operation || !dense(value.operands, 2) || !same(value.result, result)) return false;
    return same(value.operands[0], a) && same(value.operands[1], b)
        || operation !== 'division' && same(value.operands[0], b) && same(value.operands[1], a);
}
function measure(value: unknown, face: NetFaceGeometry): value is NetFaceMeasure {
    if (!record(value) || !integer(value.baseEdgeIndex) || value.kind !== (face.vertices.length === 3 ? 'triangle' : 'rectangle')) return false;
    const expected = buildNetFaceMeasure(face, value.baseEdgeIndex, value.kind === 'rectangle' && integer(value.adjacentEdgeIndex) ? value.adjacentEdgeIndex : undefined);
    if (!same(value.base, expected.base) || !same(value.height, expected.height) || !same(value.area, expected.area)) return false;
    if (expected.kind === 'rectangle') return value.adjacentEdgeIndex === expected.adjacentEdgeIndex
        && arithmetic(value.areaProduct, 'multiplication', expected.base, expected.height, expected.area);
    if (!integer(value.apexVertexIndex) || value.apexVertexIndex !== expected.apexVertexIndex || !record(value.altitudeFoot)
        || !same(value.altitudeFoot.x, expected.altitudeFoot.x) || !same(value.altitudeFoot.y, expected.altitudeFoot.y)
        || !same(value.baseOffset, expected.baseOffset)
        || !arithmetic(value.baseHeightProduct, 'multiplication', expected.base, expected.height, expected.baseHeightProduct.result)) return false;
    return arithmetic(value.halfAreaProduct, 'multiplication', expected.baseHeightProduct.result, {numerator: 1, denominator: 2}, expected.area)
        || arithmetic(value.halfAreaProduct, 'division', expected.baseHeightProduct.result, {numerator: 2, denominator: 1}, expected.area);
}
/** The empty relation branch has no stored prefixes, so sum privately before safe conversion. */
function exactSum(values: readonly NetScalar[]): NetScalar {
    let n = 0n, d = 1n;
    for (const value of values) {
        n = n * BigInt(value.denominator) + BigInt(value.numerator) * d; d *= BigInt(value.denominator);
        let a = n, b = d; while (b !== 0n) [a, b] = [b, a % b]; n /= a; d /= a;
    }
    return affineScalar(n, d);
}

/** Complete uniform family: every metric, proper fold and optional proof is checked independently. */
export function isPolyhedralNetProblem(value: unknown): value is PolyhedralNetProblem {
    try {
        if (!record(value)) return false;
        // Preserve these unknown extension fields before the geometry predicate narrows the common backbone.
        const {kind, unit, context, surfaceArea, surfaceAdditivity} = value;
        const suppliedFaces = record(value.net) ? value.net.faces : undefined;
        if (kind !== 'polyhedral-net-relations' || !isPolyhedralNetGeometry(value)
            || !record(unit) || !((unit.length === 'centimeters' && unit.area === 'square-centimeters') || (unit.length === 'meters' && unit.area === 'square-meters'))
            || !record(context) || !(context.kind === 'closed-carton' || context.kind === 'closed-solid-model') || context.boundary !== 'all-external-faces'
            || !isCanonicalSignedRational(surfaceArea) || surfaceArea.numerator <= 0 || !dense(suppliedFaces, value.net.faces.length)) return false;
        const areas = new Map<string, NetScalar>();
        for (const raw of suppliedFaces) {
            if (!record(raw) || typeof raw.faceId !== 'string') return false;
            const face = value.net.faces.find(face => face.faceId === raw.faceId);
            if (!face || !measure(raw.measure, face)) return false;
            areas.set(face.faceId, raw.measure.area);
        }
        if (!same(surfaceArea, exactSum([...areas.values()])) || !Array.isArray(surfaceAdditivity)
            || ![0, areas.size].includes(surfaceAdditivity.length) || !dense(surfaceAdditivity, surfaceAdditivity.length)) return false;
        let prefix: NetScalar = {numerator: 0, denominator: 1}; const visited = new Set<string>();
        for (const row of surfaceAdditivity) {
            if (!record(row) || typeof row.faceId !== 'string' || visited.has(row.faceId)) return false;
            const area = areas.get(row.faceId); if (!area) return false;
            const next = exactSum([prefix, area]);
            if (!arithmetic(row.arithmetic, 'addition', prefix, area, next)) return false;
            prefix = next; visited.add(row.faceId);
        }
        return surfaceAdditivity.length === 0 || same(prefix, surfaceArea);
    } catch {return false;}
}
