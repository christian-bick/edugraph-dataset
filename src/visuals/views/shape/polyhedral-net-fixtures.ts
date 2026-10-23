import type {NetScalar, PolyhedralNetProblem} from '../../../types/problems.ts';
import {buildPolyhedralNetProblem, type PolyhedralNetBuildInput} from '../../../generators/shape/polyhedral-net-helpers.ts';

const r = (numerator: number): NetScalar => ({numerator, denominator: 1});
const vertex = (vertexId: string, x: number, y: number, z: number) => ({vertexId, point: {x: r(x), y: r(y), z: r(z)}});
const point = (solidVertexId: string, x: number, y: number) => ({solidVertexId, point: {x: r(x), y: r(y)}});

/** Independent unit cube: six literal squares; expected surface area 6. */
export const literalCubeInput: PolyhedralNetBuildInput = {
    solidKind: 'rectangular-prism', unit: {length: 'centimeters', area: 'square-centimeters'},
    context: {kind: 'closed-solid-model', boundary: 'all-external-faces'},
    solid: {
        vertices: [vertex('A', 0, 0, 0), vertex('B', 1, 0, 0), vertex('C', 1, 1, 0), vertex('D', 0, 1, 0), vertex('E', 0, 0, 1), vertex('F', 1, 0, 1), vertex('G', 1, 1, 1), vertex('H', 0, 1, 1)],
        faces: [
            {faceId: 'bottom', shape: 'rectangle', vertexIds: ['A', 'D', 'C', 'B']},
            {faceId: 'top', shape: 'rectangle', vertexIds: ['E', 'F', 'G', 'H']},
            {faceId: 'front', shape: 'rectangle', vertexIds: ['A', 'B', 'F', 'E']},
            {faceId: 'right', shape: 'rectangle', vertexIds: ['B', 'C', 'G', 'F']},
            {faceId: 'back', shape: 'rectangle', vertexIds: ['C', 'D', 'H', 'G']},
            {faceId: 'left', shape: 'rectangle', vertexIds: ['D', 'A', 'E', 'H']}
        ]
    },
    planarFaces: [
        {faceId: 'front', vertices: [point('A', 0, 0), point('B', 1, 0), point('F', 1, 1), point('E', 0, 1)], baseEdgeIndex: 0, adjacentEdgeIndex: 1},
        {faceId: 'right', vertices: [point('B', 1, 0), point('C', 2, 0), point('G', 2, 1), point('F', 1, 1)], baseEdgeIndex: 0, adjacentEdgeIndex: 1},
        {faceId: 'back', vertices: [point('C', 2, 0), point('D', 3, 0), point('H', 3, 1), point('G', 2, 1)], baseEdgeIndex: 0, adjacentEdgeIndex: 1},
        {faceId: 'left', vertices: [point('D', 3, 0), point('A', 4, 0), point('E', 4, 1), point('H', 3, 1)], baseEdgeIndex: 0, adjacentEdgeIndex: 1},
        {faceId: 'bottom', vertices: [point('A', 0, 0), point('D', 0, -1), point('C', 1, -1), point('B', 1, 0)], baseEdgeIndex: 0, adjacentEdgeIndex: 1},
        {faceId: 'top', vertices: [point('E', 0, 1), point('F', 1, 1), point('G', 1, 2), point('H', 0, 2)], baseEdgeIndex: 0, adjacentEdgeIndex: 1}
    ],
    hingeEdges: [{faceId: 'front', edgeIndex: 1}, {faceId: 'right', edgeIndex: 1}, {faceId: 'back', edgeIndex: 1}, {faceId: 'front', edgeIndex: 0}, {faceId: 'front', edgeIndex: 2}],
    mathematicalRelation: 'boundary-incidence'
};

/** Rational tetrahedron: areas 6, 3/2, 2, 13/2; BCD has b=5,h=13/5,o=9/5. */
export const literalTetrahedronInput: PolyhedralNetBuildInput = {
    solidKind: 'triangular-pyramid', unit: {length: 'meters', area: 'square-meters'},
    context: {kind: 'closed-carton', boundary: 'all-external-faces'},
    solid: {
        vertices: [vertex('A', 0, 0, 0), vertex('B', 3, 0, 0), vertex('C', 0, 4, 0), vertex('D', 0, 0, 1)],
        faces: [
            {faceId: 'base', shape: 'triangle', vertexIds: ['A', 'C', 'B']},
            {faceId: 'ABD', shape: 'triangle', vertexIds: ['A', 'B', 'D']},
            {faceId: 'ACD', shape: 'triangle', vertexIds: ['A', 'D', 'C']},
            {faceId: 'BCD', shape: 'triangle', vertexIds: ['B', 'C', 'D']}
        ]
    },
    planarFaces: [
        {faceId: 'base', vertices: [point('A', 0, 0), point('C', 0, 4), point('B', 3, 0)], baseEdgeIndex: 2},
        {faceId: 'ABD', vertices: [point('A', 0, 0), point('B', 3, 0), point('D', 0, -1)], baseEdgeIndex: 0},
        {faceId: 'ACD', vertices: [point('A', 0, 0), point('D', -1, 0), point('C', 0, 4)], baseEdgeIndex: 2},
        {faceId: 'BCD', vertices: [point('B', 3, 0), point('C', 0, 4), point('D', 4, 3)], baseEdgeIndex: 0}
    ],
    hingeEdges: [{faceId: 'base', edgeIndex: 0}, {faceId: 'base', edgeIndex: 1}, {faceId: 'base', edgeIndex: 2}],
    mathematicalRelation: 'surface-additivity'
};

/** Off-center pyramid, including feet before and beyond the selected base; area140. */
export const literalExternalFootPyramidInput: PolyhedralNetBuildInput = {
    solidKind: 'rectangular-pyramid', unit: {length: 'meters', area: 'square-meters'},
    context: {kind: 'closed-solid-model', boundary: 'all-external-faces'},
    solid: {
        vertices: [vertex('A', 0, 0, 0), vertex('B', 4, 0, 0), vertex('C', 4, 5, 0), vertex('D', 0, 5, 0), vertex('S', -5, 0, 12)],
        faces: [
            {faceId: 'base', shape: 'rectangle', vertexIds: ['A', 'D', 'C', 'B']},
            {faceId: 'AB', shape: 'triangle', vertexIds: ['A', 'B', 'S']},
            {faceId: 'BC', shape: 'triangle', vertexIds: ['B', 'C', 'S']},
            {faceId: 'CD', shape: 'triangle', vertexIds: ['C', 'D', 'S']},
            {faceId: 'DA', shape: 'triangle', vertexIds: ['D', 'A', 'S']}
        ]
    },
    planarFaces: [
        {faceId: 'base', vertices: [point('A', 0, 0), point('D', 0, 5), point('C', 4, 5), point('B', 4, 0)], baseEdgeIndex: 0, adjacentEdgeIndex: 1},
        {faceId: 'AB', vertices: [point('A', 0, 0), point('B', 4, 0), point('S', -5, -12)], baseEdgeIndex: 0},
        {faceId: 'BC', vertices: [point('B', 4, 0), point('C', 4, 5), point('S', 19, 0)], baseEdgeIndex: 0},
        {faceId: 'CD', vertices: [point('C', 4, 5), point('D', 0, 5), point('S', -5, 18)], baseEdgeIndex: 0},
        {faceId: 'DA', vertices: [point('D', 0, 5), point('A', 0, 0), point('S', -13, 0)], baseEdgeIndex: 0}
    ],
    hingeEdges: [{faceId: 'base', edgeIndex: 0}, {faceId: 'base', edgeIndex: 1}, {faceId: 'base', edgeIndex: 2}, {faceId: 'base', edgeIndex: 3}],
    mathematicalRelation: 'boundary-incidence'
};

export const buildLiteralNetFixtures = (): readonly PolyhedralNetProblem[] => [literalCubeInput, literalTetrahedronInput, literalExternalFootPyramidInput].map(buildPolyhedralNetProblem);

/** Elongated box 200×1×1: a dense, very thin sheet with exact surface area802. */
export function literalSkinnyBoxInput(): PolyhedralNetBuildInput {
    const planar = literalCubeInput.planarFaces.map(face => {
        const transform = (value: typeof face.vertices[number]) => {
            const x = value.point.x.numerator, y = value.point.y.numerator;
            const next = face.faceId === 'right' ? 200 + (x - 1) : face.faceId === 'back' ? 201 + (x - 2) * 200 : face.faceId === 'left' ? 401 + (x - 3) : x * 200;
            return point(value.solidVertexId, next, y);
        };
        return {...face, vertices: [transform(face.vertices[0]), transform(face.vertices[1]), transform(face.vertices[2]), ...face.vertices.slice(3).map(transform)] as typeof face.vertices};
    });
    return {...literalCubeInput,
        solid: {...literalCubeInput.solid, vertices: [vertex('A', 0, 0, 0), vertex('B', 200, 0, 0), vertex('C', 200, 1, 0), vertex('D', 0, 1, 0), vertex('E', 0, 0, 1), vertex('F', 200, 0, 1), vertex('G', 200, 1, 1), vertex('H', 0, 1, 1)]},
        planarFaces: [planar[0], ...planar.slice(1)]
    };
}
