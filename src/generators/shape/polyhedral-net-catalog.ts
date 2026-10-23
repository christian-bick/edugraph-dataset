import {GeneratorValidationError} from '../../lib/errors.ts';
import type {AlgebraicScalar, NetFaceEdge, NetPoint2, NetPoint3, NetSolidFace, PolyhedralNetProblem} from '../../types/problems.ts';
import {affineScalar, multiplyAffineScalars} from '../algebra/algebra-affine-helpers.ts';
import {isCanonicalSignedRational} from '../number/signed-rational-helpers.ts';
import type {NetFaceBlueprint, PolyhedralNetBuildInput, PolyhedralNetRelation} from './polyhedral-net-helpers.ts';

export type PolyhedralNetCatalogShape = 'cube' | 'box' | 'triangular-prism'
    | 'triangular-pyramid' | 'square-pyramid' | 'rectangular-pyramid';
export type PolyhedralNetCatalogOptions = Readonly<{
    shape: PolyhedralNetCatalogShape;
    scale: AlgebraicScalar;
    lengthUnit: 'centimeters' | 'meters';
    mathematicalRelation: PolyhedralNetRelation;
}>;
type Point2Spec = readonly [id: string, x: number, y: number];
type Point3Spec = readonly [id: string, x: number, y: number, z: number];
type SheetSpec = {faceId: string; vertices: readonly Point2Spec[]; baseEdgeIndex: number; adjacentEdgeIndex?: number};
type Template = {solidKind: PolyhedralNetProblem['solidKind']; vertices: readonly Point3Spec[];
    faces: readonly NetSolidFace[]; sheets: readonly SheetSpec[]; hinges: readonly NetFaceEdge[]};
const fail = (message: string): never => {throw new GeneratorValidationError('polyhedral-nets', message);};
const triangle = (faceId: string, a: string, b: string, c: string): NetSolidFace => ({faceId, shape: 'triangle', vertexIds: [a, b, c]});
const rectangle = (faceId: string, a: string, b: string, c: string, d: string): NetSolidFace => ({faceId, shape: 'rectangle', vertexIds: [a, b, c, d]});
const sheet = (faceId: string, vertices: readonly Point2Spec[], baseEdgeIndex: number, adjacentEdgeIndex?: number): SheetSpec =>
    ({faceId, vertices, baseEdgeIndex, ...(adjacentEdgeIndex === undefined ? {} : {adjacentEdgeIndex})});
const nonempty = <T>(values: T[]): readonly [T, ...T[]] => {
    const first = values[0];
    if (first === undefined) return fail('The literal solid catalog must contain a complete nonempty registry.');
    return [first, ...values.slice(1)];
};

/** One fixed cut tree for each actual source geometry; no answer-only unfolding entropy. */
function box(L: number, W: number, H: number): Template {
    return {solidKind: 'rectangular-prism', vertices: [['A', 0, 0, 0], ['B', L, 0, 0], ['C', L, W, 0], ['D', 0, W, 0],
        ['E', 0, 0, H], ['F', L, 0, H], ['G', L, W, H], ['H', 0, W, H]],
        faces: [rectangle('bottom', 'A', 'D', 'C', 'B'), rectangle('top', 'E', 'F', 'G', 'H'),
            rectangle('front', 'A', 'B', 'F', 'E'), rectangle('right', 'B', 'C', 'G', 'F'),
            rectangle('back', 'C', 'D', 'H', 'G'), rectangle('left', 'D', 'A', 'E', 'H')],
        sheets: [
            sheet('bottom', [['A', 0, 0], ['D', 0, -W], ['C', L, -W], ['B', L, 0]], 0, 1),
            sheet('top', [['E', 0, H], ['F', L, H], ['G', L, H + W], ['H', 0, H + W]], 0, 1),
            sheet('front', [['A', 0, 0], ['B', L, 0], ['F', L, H], ['E', 0, H]], 0, 1),
            sheet('right', [['B', L, 0], ['C', L + W, 0], ['G', L + W, H], ['F', L, H]], 0, 1),
            sheet('back', [['C', L + W, 0], ['D', 2 * L + W, 0], ['H', 2 * L + W, H], ['G', L + W, H]], 0, 1),
            sheet('left', [['D', 2 * L + W, 0], ['A', 2 * L + 2 * W, 0], ['E', 2 * L + 2 * W, H], ['H', 2 * L + W, H]], 0, 1)
        ], hinges: [{faceId: 'front', edgeIndex: 1}, {faceId: 'right', edgeIndex: 1}, {faceId: 'back', edgeIndex: 1},
            {faceId: 'front', edgeIndex: 0}, {faceId: 'front', edgeIndex: 2}]};
}
function triangularPrism(): Template {
    return {solidKind: 'triangular-prism', vertices: [['A', 0, 0, 0], ['B', 3, 0, 0], ['C', 0, 4, 0],
        ['A1', 0, 0, 2], ['B1', 3, 0, 2], ['C1', 0, 4, 2]],
        faces: [triangle('bottom', 'A', 'C', 'B'), triangle('top', 'A1', 'B1', 'C1'),
            rectangle('side-AB', 'A', 'B', 'B1', 'A1'), rectangle('side-BC', 'B', 'C', 'C1', 'B1'), rectangle('side-CA', 'C', 'A', 'A1', 'C1')],
        sheets: [sheet('bottom', [['A', 0, 0], ['C', 0, -4], ['B', 3, 0]], 2),
            sheet('top', [['A1', 0, 2], ['B1', 3, 2], ['C1', 0, 6]], 0),
            sheet('side-AB', [['A', 0, 0], ['B', 3, 0], ['B1', 3, 2], ['A1', 0, 2]], 0, 1),
            sheet('side-BC', [['B', 3, 0], ['C', 8, 0], ['C1', 8, 2], ['B1', 3, 2]], 0, 1),
            sheet('side-CA', [['C', 8, 0], ['A', 12, 0], ['A1', 12, 2], ['C1', 8, 2]], 0, 1)],
        hinges: [{faceId: 'side-AB', edgeIndex: 1}, {faceId: 'side-BC', edgeIndex: 1},
            {faceId: 'side-AB', edgeIndex: 0}, {faceId: 'side-AB', edgeIndex: 2}]};
}
function tetrahedron(): Template {
    return {solidKind: 'triangular-pyramid', vertices: [['A', 0, 0, 0], ['B', 3, 0, 0], ['C', 0, 4, 0], ['D', 0, 0, 1]],
        faces: [triangle('base', 'A', 'C', 'B'), triangle('side-AB', 'A', 'B', 'D'),
            triangle('side-AC', 'A', 'D', 'C'), triangle('side-BC', 'B', 'C', 'D')],
        sheets: [sheet('base', [['A', 0, 0], ['C', 0, 4], ['B', 3, 0]], 2),
            sheet('side-AB', [['A', 0, 0], ['B', 3, 0], ['D', 0, -1]], 0),
            sheet('side-AC', [['A', 0, 0], ['D', -1, 0], ['C', 0, 4]], 2),
            sheet('side-BC', [['B', 3, 0], ['C', 0, 4], ['D', 4, 3]], 0)],
        hinges: [{faceId: 'base', edgeIndex: 0}, {faceId: 'base', edgeIndex: 1}, {faceId: 'base', edgeIndex: 2}]};
}
function pyramid(a: number, b: number, z: number, hAB: number, hBC: number): Template {
    return {solidKind: 'rectangular-pyramid', vertices: [['A', -a, -b, 0], ['B', a, -b, 0], ['C', a, b, 0], ['D', -a, b, 0], ['S', 0, 0, z]],
        faces: [rectangle('base', 'A', 'D', 'C', 'B'), triangle('side-AB', 'A', 'B', 'S'),
            triangle('side-BC', 'B', 'C', 'S'), triangle('side-CD', 'C', 'D', 'S'), triangle('side-DA', 'D', 'A', 'S')],
        sheets: [sheet('base', [['A', -a, -b], ['D', -a, b], ['C', a, b], ['B', a, -b]], 0, 1),
            sheet('side-AB', [['A', -a, -b], ['B', a, -b], ['S', 0, -b - hAB]], 0),
            sheet('side-BC', [['B', a, -b], ['C', a, b], ['S', a + hBC, 0]], 0),
            sheet('side-CD', [['C', a, b], ['D', -a, b], ['S', 0, b + hAB]], 0),
            sheet('side-DA', [['D', -a, b], ['A', -a, -b], ['S', -a - hBC, 0]], 0)],
        hinges: [0, 1, 2, 3].map(edgeIndex => ({faceId: 'base', edgeIndex}))};
}

/** Literal geometry scaled in the same original unit; no folds, areas or layout retries. */
export function makePolyhedralNetCatalogInput(options: PolyhedralNetCatalogOptions): PolyhedralNetBuildInput {
    if (typeof options !== 'object' || options === null || !isCanonicalSignedRational(options.scale) || options.scale.numerator <= 0
        || !['centimeters', 'meters'].includes(options.lengthUnit)
        || !['boundary-incidence', 'surface-additivity'].includes(options.mathematicalRelation)) {
        return fail('Expected a positive exact physical scale, supported unit and mathematical relation.');
    }
    let template: Template;
    switch (options.shape) {
        case 'cube': template = box(1, 1, 1); break;
        case 'box': template = box(2, 3, 4); break;
        case 'triangular-prism': template = triangularPrism(); break;
        case 'triangular-pyramid': template = tetrahedron(); break;
        case 'square-pyramid': template = pyramid(3, 3, 4, 5, 5); break;
        case 'rectangular-pyramid': template = pyramid(5, 9, 12, 15, 13); break;
        default: return fail('Expected a supported exact source solid.');
    }
    const scale = (value: number) => multiplyAffineScalars(affineScalar(BigInt(value), 1n), options.scale);
    const planarFaces = template.sheets.map((row): NetFaceBlueprint => {
        const points = row.vertices.map(([solidVertexId, x, y]) => ({solidVertexId, point: {x: scale(x), y: scale(y)} satisfies NetPoint2}));
        return {faceId: row.faceId, vertices: [points[0]!, points[1]!, points[2]!, ...points.slice(3)],
            baseEdgeIndex: row.baseEdgeIndex, ...(row.adjacentEdgeIndex === undefined ? {} : {adjacentEdgeIndex: row.adjacentEdgeIndex})};
    });
    return {solidKind: template.solidKind,
        unit: {length: options.lengthUnit, area: options.lengthUnit === 'centimeters' ? 'square-centimeters' : 'square-meters'},
        context: {kind: options.shape === 'cube' || options.shape === 'box' || options.shape === 'triangular-prism' ? 'closed-carton' : 'closed-solid-model',
            boundary: 'all-external-faces'},
        solid: {vertices: nonempty(template.vertices.map(([vertexId, x, y, z]) => ({vertexId,
            point: {x: scale(x), y: scale(y), z: scale(z)} satisfies NetPoint3}))), faces: nonempty([...template.faces])},
        planarFaces: nonempty(planarFaces), hingeEdges: nonempty([...template.hinges]), mathematicalRelation: options.mathematicalRelation};
}
