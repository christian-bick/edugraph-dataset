import {describe, expect, it} from 'vitest';
import type {NetFaceFold, NetPlanarFace, NetPoint2, NetPoint3, NetScalar, NetSolidEdge, NetSolidFace, PolyhedralNetProblem} from '../../types/problems.ts';
import {buildPolyhedralNetProblem, type NetFaceBlueprint} from './polyhedral-net-helpers.ts';
import {makePolyhedralNetCatalogInput} from './polyhedral-net-catalog.ts';
import {isPolyhedralNetProblem} from './polyhedral-net-validation.ts';

const q = (numerator: number, denominator = 1): NetScalar => ({numerator, denominator});
const p2 = (x: number, y: number): NetPoint2 => ({x: q(x), y: q(y)});
const p3 = (x: number, y: number, z: number): NetPoint3 => ({x: q(x), y: q(y), z: q(z)});
const multiply = (a: number, b: number) => ({kind: 'binary' as const, operation: 'multiplication' as const, operands: [q(a), q(b)] as const, result: q(a * b)});
const add = (a: number, b: number) => ({kind: 'binary' as const, operation: 'addition' as const, operands: [q(a), q(b)] as const, result: q(a + b)});
const nonempty = <T,>(values: readonly T[]): readonly [T, ...T[]] => {if (!values.length) throw Error('fixture'); return [values[0]!, ...values.slice(1)];};

/** Complete independently written unit cube, including exact proper matrices and all12 incidences. */
function literalCube(): PolyhedralNetProblem {
    const face = (faceId: string, ids: readonly [string, string, string, string]): NetSolidFace => ({faceId, shape: 'rectangle', vertexIds: ids});
    const sheet = (faceId: string, rows: readonly [string, number, number][]): NetPlanarFace => {
        const points = rows.map(([solidVertexId, x, y]) => ({solidVertexId, point: p2(x, y)}));
        return {faceId, vertices: [points[0]!, points[1]!, points[2]!, points[3]!],
            measure: {kind: 'rectangle', baseEdgeIndex: 0, adjacentEdgeIndex: 1, base: q(1), height: q(1), areaProduct: multiply(1, 1), area: q(1)}};
    };
    const edge = (edgeId: string, a: string, b: string, first: string, i: number, second: string, j: number): NetSolidEdge =>
        ({edgeId, vertexIds: [a, b], incidences: [{faceId: first, edgeIndex: i}, {faceId: second, edgeIndex: j}], lengthSquared: q(1)});
    const edges = [edge('AD', 'A', 'D', 'bottom', 0, 'left', 0), edge('DC', 'D', 'C', 'bottom', 1, 'back', 0),
        edge('CB', 'C', 'B', 'bottom', 2, 'right', 0), edge('BA', 'B', 'A', 'bottom', 3, 'front', 0),
        edge('EF', 'E', 'F', 'top', 0, 'front', 2), edge('FG', 'F', 'G', 'top', 1, 'right', 2),
        edge('GH', 'G', 'H', 'top', 2, 'back', 2), edge('HE', 'H', 'E', 'top', 3, 'left', 2),
        edge('AE', 'A', 'E', 'front', 3, 'left', 1), edge('BF', 'B', 'F', 'front', 1, 'right', 3),
        edge('CG', 'C', 'G', 'right', 1, 'back', 3), edge('DH', 'D', 'H', 'back', 1, 'left', 3)];
    const hingeIds = new Set(['BA', 'EF', 'BF', 'CG', 'DH']);
    const pair = (e: NetSolidEdge) => ({solidEdgeId: e.edgeId, incidences: e.incidences});
    const fold = (faceId: string, matrix: readonly [readonly [number, number, number], readonly [number, number, number], readonly [number, number, number]], translation: NetPoint3): NetFaceFold => ({faceId,
        rotation: [[q(matrix[0][0]), q(matrix[0][1]), q(matrix[0][2])], [q(matrix[1][0]), q(matrix[1][1]), q(matrix[1][2])], [q(matrix[2][0]), q(matrix[2][1]), q(matrix[2][2])]], translation});
    return {kind: 'polyhedral-net-relations', solidKind: 'rectangular-prism', unit: {length: 'centimeters', area: 'square-centimeters'}, context: {kind: 'closed-carton', boundary: 'all-external-faces'},
        solid: {vertices: [{vertexId: 'A', point: p3(0, 0, 0)}, {vertexId: 'B', point: p3(1, 0, 0)}, {vertexId: 'C', point: p3(1, 1, 0)}, {vertexId: 'D', point: p3(0, 1, 0)},
            {vertexId: 'E', point: p3(0, 0, 1)}, {vertexId: 'F', point: p3(1, 0, 1)}, {vertexId: 'G', point: p3(1, 1, 1)}, {vertexId: 'H', point: p3(0, 1, 1)}],
        faces: [face('bottom', ['A', 'D', 'C', 'B']), face('top', ['E', 'F', 'G', 'H']), face('front', ['A', 'B', 'F', 'E']), face('right', ['B', 'C', 'G', 'F']), face('back', ['C', 'D', 'H', 'G']), face('left', ['D', 'A', 'E', 'H'])], edges: nonempty(edges)},
        net: {faces: [sheet('bottom', [['A', 0, 0], ['D', 0, -1], ['C', 1, -1], ['B', 1, 0]]), sheet('top', [['E', 0, 1], ['F', 1, 1], ['G', 1, 2], ['H', 0, 2]]),
            sheet('front', [['A', 0, 0], ['B', 1, 0], ['F', 1, 1], ['E', 0, 1]]), sheet('right', [['B', 1, 0], ['C', 2, 0], ['G', 2, 1], ['F', 1, 1]]),
            sheet('back', [['C', 2, 0], ['D', 3, 0], ['H', 3, 1], ['G', 2, 1]]), sheet('left', [['D', 3, 0], ['A', 4, 0], ['E', 4, 1], ['H', 3, 1]])],
        hinges: nonempty(edges.filter(e => hingeIds.has(e.edgeId)).map(pair)), cutSeams: nonempty(edges.filter(e => !hingeIds.has(e.edgeId)).map(pair)),
        folds: [fold('bottom', [[1, 0, 0], [0, -1, 0], [0, 0, -1]], p3(0, 0, 0)), fold('top', [[1, 0, 0], [0, 1, 0], [0, 0, 1]], p3(0, -1, 1)),
            fold('front', [[1, 0, 0], [0, 0, -1], [0, 1, 0]], p3(0, 0, 0)), fold('right', [[0, 0, 1], [1, 0, 0], [0, 1, 0]], p3(1, -1, 0)),
            fold('back', [[-1, 0, 0], [0, 0, 1], [0, 1, 0]], p3(3, 1, 0)), fold('left', [[0, 0, -1], [-1, 0, 0], [0, 1, 0]], p3(0, 4, 0))]}, surfaceArea: q(6), surfaceAdditivity: []};
}

describe('complete polyhedral net proof guard', () => {
    it('accepts independent literal geometry and empty/full exact surface certificates', () => {
        const data = literalCube(), before = JSON.stringify(data);
        expect(isPolyhedralNetProblem(data)).toBe(true);
        const proof = [...data.net.faces].reverse().map((face, index) => ({faceId: face.faceId, arithmetic: {...add(index, 1), operands: [q(1), q(index)] as const}}));
        expect(isPolyhedralNetProblem({...data, surfaceAdditivity: proof})).toBe(true);
        expect(isPolyhedralNetProblem({...data, unit: {length: 'meters', area: 'square-meters'}, context: {kind: 'closed-solid-model', boundary: 'all-external-faces'}})).toBe(true);
        expect(JSON.stringify(data)).toBe(before);
    });

    it('accepts all class/relation members and preserves independent expected area oracles', () => {
        const cases = [['cube', 6], ['box', 52], ['triangular-prism', 36], ['triangular-pyramid', 16], ['square-pyramid', 96], ['rectangular-pyramid', 564]] as const;
        for (const [shape, expected] of cases) for (const mathematicalRelation of ['boundary-incidence', 'surface-additivity'] as const) {
            const data = buildPolyhedralNetProblem(makePolyhedralNetCatalogInput({shape, mathematicalRelation, scale: q(1), lengthUnit: 'centimeters'}));
            expect(data.surfaceArea).toEqual(q(expected)); expect(isPolyhedralNetProblem(data)).toBe(true);
        }
    });

    it('accepts a genuinely off-center pyramid with unequal side altitudes and area144', () => {
        const face = (faceId: string, ids: readonly [string, string, string] | readonly [string, string, string, string]): NetSolidFace => ids.length === 3
            ? {faceId, shape: 'triangle', vertexIds: ids} : {faceId, shape: 'rectangle', vertexIds: ids};
        const planar = (faceId: string, coords: readonly [string, number, number][], rectangle = false): NetFaceBlueprint => {
            const vertices = coords.map(([solidVertexId, x, y]) => ({solidVertexId, point: p2(x, y)}));
            return {faceId, vertices: [vertices[0]!, vertices[1]!, vertices[2]!, ...vertices.slice(3)], baseEdgeIndex: 0, ...(rectangle ? {adjacentEdgeIndex: 1} : {})};
        };
        const data = buildPolyhedralNetProblem({solidKind: 'rectangular-pyramid', unit: {length: 'meters', area: 'square-meters'}, context: {kind: 'closed-solid-model', boundary: 'all-external-faces'},
            solid: {vertices: [{vertexId: 'A', point: p3(0, 0, 0)}, {vertexId: 'B', point: p3(6, 0, 0)}, {vertexId: 'C', point: p3(6, 6, 0)}, {vertexId: 'D', point: p3(0, 6, 0)}, {vertexId: 'S', point: p3(0, 0, 8)}],
                faces: [face('base', ['A', 'D', 'C', 'B']), face('AB', ['A', 'B', 'S']), face('BC', ['B', 'C', 'S']), face('CD', ['C', 'D', 'S']), face('DA', ['D', 'A', 'S'])]},
            planarFaces: [planar('base', [['A', 0, 0], ['D', 0, 6], ['C', 6, 6], ['B', 6, 0]], true), planar('AB', [['A', 0, 0], ['B', 6, 0], ['S', 0, -8]]),
                planar('BC', [['B', 6, 0], ['C', 6, 6], ['S', 16, 0]]), planar('CD', [['C', 6, 6], ['D', 0, 6], ['S', 0, 16]]), planar('DA', [['D', 0, 6], ['A', 0, 0], ['S', -8, 0]])],
            hingeEdges: nonempty([0, 1, 2, 3].map(edgeIndex => ({faceId: 'base', edgeIndex}))), mathematicalRelation: 'surface-additivity'});
        expect(data.surfaceArea).toEqual(q(144));
        expect(data.net.faces.map(f => f.measure.height)).toEqual([q(6), q(8), q(10), q(10), q(8)]);
        expect(isPolyhedralNetProblem(data)).toBe(true);
    });

    it('accepts alternate rectangle bases and truthful commuted/halved triangle arithmetic', () => {
        const cube = literalCube();
        const alternate = {...cube, net: {...cube.net, faces: cube.net.faces.map(face => ({...face, measure: {...face.measure, baseEdgeIndex: 2, adjacentEdgeIndex: 1}}))}};
        expect(isPolyhedralNetProblem(alternate)).toBe(true);
        const tetra = buildPolyhedralNetProblem(makePolyhedralNetCatalogInput({shape: 'triangular-pyramid', mathematicalRelation: 'boundary-incidence', scale: q(1), lengthUnit: 'meters'}));
        const faces = tetra.net.faces.map(face => {
            if (face.measure.kind !== 'triangle') throw Error('fixture');
            const m = face.measure;
            return {...face, measure: {...m, baseHeightProduct: {...m.baseHeightProduct, operands: [m.height, m.base]}, halfAreaProduct: {kind: 'binary', operation: 'division', operands: [m.baseHeightProduct.result, q(2)], result: m.area}}};
        });
        expect(isPolyhedralNetProblem({...tetra, net: {...tetra.net, faces}})).toBe(true);
    });

    it('requires every face metric and the actual all-external total, not an area-only match', () => {
        const data = literalCube(), first = data.net.faces[0];
        const cases: unknown[] = [
            {...data, surfaceArea: q(5)}, {...data, unit: {length: 'centimeters', area: 'square-meters'}},
            {...data, context: {kind: {toString: () => 'closed-carton'}, boundary: 'all-external-faces'}}, {...data, context: {...data.context, boundary: 'some-faces'}},
            {...data, context: {kind: new String('closed-carton'), boundary: 'all-external-faces'}},
            {...data, net: {...data.net, faces: [{...first, measure: {...first.measure, base: q(2)}}, ...data.net.faces.slice(1)]}},
            {...data, net: {...data.net, faces: [{...first, measure: {...first.measure, baseEdgeIndex: -0}}, ...data.net.faces.slice(1)]}},
            {...data, net: {...data.net, faces: [{...first, measure: {...first.measure, areaProduct: add(0, 1)}}, ...data.net.faces.slice(1)]}},
            {...data, net: {...data.net, faces: [{...first, measure: {...first.measure, kind: 'triangle'}}, ...data.net.faces.slice(1)]}}
        ];
        for (const invalid of cases) expect(isPolyhedralNetProblem(invalid)).toBe(false);
    });

    it('rejects false triangle base, foot, signed offset, half-area and incidence evidence', () => {
        const data = buildPolyhedralNetProblem(makePolyhedralNetCatalogInput({shape: 'triangular-pyramid', mathematicalRelation: 'surface-additivity', scale: q(1), lengthUnit: 'meters'}));
        const first = data.net.faces[0]; if (first.measure.kind !== 'triangle') throw Error('fixture');
        for (const patch of [{baseOffset: q(99)}, {altitudeFoot: p2(99, 99)}, {height: q(99)}, {baseEdgeIndex: 3}, {apexVertexIndex: -0},
            {halfAreaProduct: {...first.measure.halfAreaProduct, result: q(999)}}, {baseHeightProduct: {...first.measure.baseHeightProduct, operands: [q(0), q(0)]}}]) {
            expect(isPolyhedralNetProblem({...data, net: {...data.net, faces: [{...first, measure: {...first.measure, ...patch}}, ...data.net.faces.slice(1)]}})).toBe(false);
        }
        expect(isPolyhedralNetProblem({...data, net: {...data.net, cutSeams: [data.net.cutSeams[0]]}})).toBe(false);
    });

    it('requires a complete dependency-ordered addition proof without duplicated/lost faces', () => {
        const data = literalCube(), complete = data.net.faces.map((face, index) => ({faceId: face.faceId, arithmetic: add(index, 1)}));
        expect(isPolyhedralNetProblem({...data, surfaceAdditivity: complete})).toBe(true);
        for (const proof of [complete.slice(1), [complete[0], complete[0], ...complete.slice(2)], complete.map((row, index) => index ? row : {...row, arithmetic: add(1, 1)}), new Array(6), new Array(2 ** 32 - 1)]) {
            expect(isPolyhedralNetProblem({...data, surfaceAdditivity: proof})).toBe(false);
        }
    });

    it('is total for malformed/hostile input and rejects sparse inherited certificate rows', () => {
        const data = literalCube(), inherited = new Array(6); Object.setPrototypeOf(inherited, Object.assign(Object.create(Array.prototype), {0: {faceId: 'bottom', arithmetic: add(0, 1)}}));
        const getter = Object.defineProperty({...data}, 'unit', {get() {throw Error('hostile');}}), cycle: Record<string, unknown> = {}; cycle.net = cycle;
        for (const value of [null, true, 'net', [], {}, cycle, getter, {...data, kind: 'unsupported'}, {...data, surfaceArea: q(-0)}, {...data, surfaceAdditivity: inherited}, {...data, net: {...data.net, faces: new Array(6)}}]) expect(isPolyhedralNetProblem(value)).toBe(false);
    });
});
