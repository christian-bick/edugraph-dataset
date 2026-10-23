import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import type {NetFaceFold, NetPoint2, NetPoint3, PolyhedralNetProblem} from '../../types/problems.ts';
import {buildPolyhedralNetProblem, isPolyhedralNetProblem, type PolyhedralNetBuildInput} from './polyhedral-net-helpers.ts';

const q = (numerator: number, denominator = 1) => ({numerator, denominator});
const p2 = (x: number, y: number): NetPoint2 => ({x: q(x), y: q(y)});
const p3 = (x: number, y: number, z: number): NetPoint3 => ({x: q(x), y: q(y), z: q(z)});
const vertex = (solidVertexId: string, x: number, y: number) => ({solidVertexId, point: p2(x, y)});
type Mutable<T> = T extends object ? {-readonly [Key in keyof T]: Mutable<T[Key]>} : T;
const mutableClone = <T>(value: T): Mutable<T> => structuredClone(value) as unknown as Mutable<T>;

/** Literal corner-apex pyramid, independent of the centered catalog. */
function offCenterPyramid(): PolyhedralNetBuildInput {
    return {solidKind: 'rectangular-pyramid', unit: {length: 'meters', area: 'square-meters'},
        context: {kind: 'closed-solid-model', boundary: 'all-external-faces'}, mathematicalRelation: 'surface-additivity',
        solid: {vertices: [
            {vertexId: 'A', point: p3(0, 0, 0)}, {vertexId: 'B', point: p3(6, 0, 0)},
            {vertexId: 'C', point: p3(6, 6, 0)}, {vertexId: 'D', point: p3(0, 6, 0)}, {vertexId: 'S', point: p3(0, 0, 8)}
        ], faces: [
            {faceId: 'base', shape: 'rectangle', vertexIds: ['A', 'D', 'C', 'B']},
            {faceId: 'AB', shape: 'triangle', vertexIds: ['A', 'B', 'S']},
            {faceId: 'BC', shape: 'triangle', vertexIds: ['B', 'C', 'S']},
            {faceId: 'CD', shape: 'triangle', vertexIds: ['C', 'D', 'S']},
            {faceId: 'DA', shape: 'triangle', vertexIds: ['D', 'A', 'S']}
        ]}, planarFaces: [
            {faceId: 'base', vertices: [vertex('A', 0, 0), vertex('D', 0, 6), vertex('C', 6, 6), vertex('B', 6, 0)], baseEdgeIndex: 0, adjacentEdgeIndex: 1},
            {faceId: 'AB', vertices: [vertex('A', 0, 0), vertex('B', 6, 0), vertex('S', 0, -8)], baseEdgeIndex: 0},
            {faceId: 'BC', vertices: [vertex('B', 6, 0), vertex('C', 6, 6), vertex('S', 16, 0)], baseEdgeIndex: 0},
            {faceId: 'CD', vertices: [vertex('C', 6, 6), vertex('D', 0, 6), vertex('S', 0, 16)], baseEdgeIndex: 0},
            {faceId: 'DA', vertices: [vertex('D', 0, 6), vertex('A', 0, 0), vertex('S', -8, 0)], baseEdgeIndex: 0}
        ], hingeEdges: [{faceId: 'base', edgeIndex: 0}, {faceId: 'base', edgeIndex: 1}, {faceId: 'base', edgeIndex: 2}, {faceId: 'base', edgeIndex: 3}]};
}

function cube(): PolyhedralNetBuildInput {
    const face = (faceId: string, vertices: readonly [string, string, string, string]) => ({faceId, shape: 'rectangle' as const, vertexIds: vertices});
    const planar = (faceId: string, vertices: readonly [ReturnType<typeof vertex>, ReturnType<typeof vertex>, ReturnType<typeof vertex>, ReturnType<typeof vertex>]) =>
        ({faceId, vertices, baseEdgeIndex: 0, adjacentEdgeIndex: 1});
    return {solidKind: 'rectangular-prism', unit: {length: 'centimeters', area: 'square-centimeters'},
        context: {kind: 'closed-carton', boundary: 'all-external-faces'}, mathematicalRelation: 'surface-additivity',
        solid: {vertices: [
            {vertexId: 'A', point: p3(0, 0, 0)}, {vertexId: 'B', point: p3(1, 0, 0)},
            {vertexId: 'C', point: p3(1, 1, 0)}, {vertexId: 'D', point: p3(0, 1, 0)},
            {vertexId: 'E', point: p3(0, 0, 1)}, {vertexId: 'F', point: p3(1, 0, 1)},
            {vertexId: 'G', point: p3(1, 1, 1)}, {vertexId: 'H', point: p3(0, 1, 1)}],
        faces: [face('bottom', ['A', 'D', 'C', 'B']), face('top', ['E', 'F', 'G', 'H']), face('front', ['A', 'B', 'F', 'E']),
            face('right', ['B', 'C', 'G', 'F']), face('back', ['C', 'D', 'H', 'G']), face('left', ['D', 'A', 'E', 'H'])]},
        planarFaces: [planar('bottom', [vertex('A', 0, 0), vertex('D', 0, -1), vertex('C', 1, -1), vertex('B', 1, 0)]),
            planar('top', [vertex('E', 0, 1), vertex('F', 1, 1), vertex('G', 1, 2), vertex('H', 0, 2)]),
            planar('front', [vertex('A', 0, 0), vertex('B', 1, 0), vertex('F', 1, 1), vertex('E', 0, 1)]),
            planar('right', [vertex('B', 1, 0), vertex('C', 2, 0), vertex('G', 2, 1), vertex('F', 1, 1)]),
            planar('back', [vertex('C', 2, 0), vertex('D', 3, 0), vertex('H', 3, 1), vertex('G', 2, 1)]),
            planar('left', [vertex('D', 3, 0), vertex('A', 4, 0), vertex('E', 4, 1), vertex('H', 3, 1)])],
        hingeEdges: [{faceId: 'front', edgeIndex: 1}, {faceId: 'right', edgeIndex: 1}, {faceId: 'back', edgeIndex: 1},
            {faceId: 'front', edgeIndex: 0}, {faceId: 'front', edgeIndex: 2}]};
}

// Independent BigInt rational fold application: no production geometric helper used.
type Fraction = readonly [bigint, bigint];
const fraction = (value: {numerator: number; denominator: number}): Fraction => [BigInt(value.numerator), BigInt(value.denominator)];
const plus = (a: Fraction, b: Fraction): Fraction => [a[0] * b[1] + b[0] * a[1], a[1] * b[1]];
const times = (a: Fraction, b: Fraction): Fraction => [a[0] * b[0], a[1] * b[1]];
function assertFold(fold: NetFaceFold, point: NetPoint2, expected: NetPoint3): void {
    for (const [index, axis] of ['x', 'y', 'z'].entries()) {
        const row = fold.rotation[index]!;
        const actual = plus(plus(times(fraction(row[0]), fraction(point.x)), times(fraction(row[1]), fraction(point.y))), fraction(fold.translation[axis as keyof NetPoint3]));
        const target = fraction(expected[axis as keyof NetPoint3]);
        expect(actual[0] * target[1]).toBe(target[0] * actual[1]);
    }
}
function assertAllFoldIncidences(data: PolyhedralNetProblem): void {
    const points = new Map(data.solid.vertices.map(row => [row.vertexId, row.point]));
    for (const face of data.net.faces) {
        const fold = data.net.folds.find(row => row.faceId === face.faceId)!;
        for (const corner of face.vertices) assertFold(fold, corner.point, points.get(corner.solidVertexId)!);
    }
    const incidences = [...data.net.hinges, ...data.net.cutSeams];
    expect(new Set(incidences.map(row => row.solidEdgeId)).size).toBe(data.solid.edges.length);
    expect(incidences).toHaveLength(data.solid.edges.length);
}

describe('polyhedral net pure builder', () => {
    it('derives the independent 144 square-meter off-center pyramid with true unequal face altitudes', () => {
        const input = offCenterPyramid();
        const before = JSON.stringify(input);
        const data = buildPolyhedralNetProblem(input);
        expect(data.surfaceArea).toEqual(q(144));
        expect(data.net.faces.map(face => face.measure.area)).toEqual([q(36), q(24), q(30), q(30), q(24)]);
        expect(data.net.faces.slice(1).map(face => face.measure.kind === 'triangle' && [face.measure.base, face.measure.height, face.measure.baseOffset]))
            .toEqual([[q(6), q(8), q(0)], [q(6), q(10), q(0)], [q(6), q(10), q(6)], [q(6), q(8), q(6)]]);
        expect(data.surfaceAdditivity.map(row => row.arithmetic.result)).toEqual([q(36), q(60), q(90), q(120), q(144)]);
        expect(JSON.stringify(input)).toBe(before);
        expect(buildPolyhedralNetProblem(input)).toEqual(data);
        assertAllFoldIncidences(data);
    });

    it('changes only the actual addition certificate between the two mathematical relations', () => {
        const input = cube();
        const full = buildPolyhedralNetProblem(input);
        const boundary = buildPolyhedralNetProblem({...input, mathematicalRelation: 'boundary-incidence'});
        expect(full.surfaceArea).toEqual(q(6));
        expect(full.surfaceAdditivity).toHaveLength(6);
        expect(boundary.surfaceAdditivity).toEqual([]);
        expect({...full, surfaceAdditivity: []}).toEqual(boundary);
        assertAllFoldIncidences(boundary);
    });

    it('accepts a genuinely different valid hinge tree instead of restricting to the catalog sheet', () => {
        const input = cube();
        const faces = input.planarFaces.map(face => face.faceId === 'top' ? {...face,
            vertices: [vertex('E', 1, 2), vertex('F', 1, 1), vertex('G', 2, 1), vertex('H', 2, 2)] as const} : face);
        const hingeEdges = input.hingeEdges.map(row => row.faceId === 'front' && row.edgeIndex === 2 ? {faceId: 'right', edgeIndex: 2} : row);
        const data = buildPolyhedralNetProblem({...input, planarFaces: [faces[0]!, ...faces.slice(1)], hingeEdges: [hingeEdges[0]!, ...hingeEdges.slice(1)]});
        expect(data.surfaceArea).toEqual(q(6));
        expect(data.net.hinges.some(row => row.incidences.some(incidence => incidence.faceId === 'right' && incidence.edgeIndex === 2))).toBe(true);
        assertAllFoldIncidences(data);
    });

    it('accepts a rational proper 3D pose and rational sheet translation without a canonical-axis restriction', () => {
        const input = offCenterPyramid();
        // Rz=(3/5,-4/5;4/5,3/5), then translation (7,-2,3).
        const vertices = input.solid.vertices.map(({vertexId, point}) => ({vertexId,
            point: {x: q(3 * point.x.numerator - 4 * point.y.numerator + 35, 5),
                y: q(4 * point.x.numerator + 3 * point.y.numerator - 10, 5), z: q(point.z.numerator + 3)}}));
        // Reduce the few integer coordinates so the literal input remains canonical.
        for (const row of vertices) for (const axis of ['x', 'y'] as const) if (row.point[axis].numerator % 5 === 0) row.point[axis] = q(row.point[axis].numerator / 5);
        const faces = input.planarFaces.map(face => {
            const corners = face.vertices.map(corner => ({...corner,
                point: {x: q(corner.point.x.numerator * 2 + 1, 2), y: q(corner.point.y.numerator * 2 - 3, 2)}}));
            return {...face, vertices: [corners[0]!, corners[1]!, corners[2]!, ...corners.slice(3)] as const};
        });
        const data = buildPolyhedralNetProblem({...input, solid: {...input.solid, vertices: [vertices[0]!, ...vertices.slice(1)]},
            planarFaces: [faces[0]!, ...faces.slice(1)]});
        expect(data.surfaceArea).toEqual(q(144));
        assertAllFoldIncidences(data);
    });

    it('keeps the public guard independent of builder addition order and multiplication spelling', () => {
        const data = mutableClone(buildPolyhedralNetProblem(offCenterPyramid()));
        for (const face of data.net.faces) {
            const work = face.measure.kind === 'triangle' ? face.measure.baseHeightProduct : face.measure.areaProduct;
            work.operands = [work.operands[1], work.operands[0]];
            if (face.measure.kind === 'triangle') face.measure.halfAreaProduct = {
                kind: 'binary', operation: 'division', operands: [face.measure.baseHeightProduct.result, q(2)], result: face.measure.area};
        }
        let sum = 0;
        data.surfaceAdditivity = [...data.net.faces].reverse().map(face => {
            const previous = sum;
            sum += face.measure.area.numerator;
            return {faceId: face.faceId, arithmetic: {kind: 'binary' as const, operation: 'addition' as const,
                operands: [face.measure.area, q(previous)] as [ReturnType<typeof q>, ReturnType<typeof q>], result: q(sum)}};
        });
        expect(isPolyhedralNetProblem(data)).toBe(true);
    });

    it('rejects missing/incoherent metadata and malformed source or measured descriptors', () => {
        for (const mutate of [
            (value: Record<string, unknown>) => {delete value.unit;},
            (value: Record<string, unknown>) => {value.unit = {length: 'meters', area: 'square-centimeters'};},
            (value: Record<string, unknown>) => {value.context = {kind: 'open-box', boundary: 'all-external-faces'};},
            (value: Record<string, unknown>) => {value.context = {kind: 'closed-carton', boundary: 'visible-faces'};},
            (value: Record<string, unknown>) => {value.mathematicalRelation = 'draw-net';},
            (value: Record<string, unknown>) => {value.planarFaces = [];}
        ]) {
            const input = structuredClone(cube());
            mutate(input as unknown as Record<string, unknown>);
            expect(() => buildPolyhedralNetProblem(input)).toThrow(GeneratorValidationError);
        }
        expect(() => buildPolyhedralNetProblem(undefined as unknown as PolyhedralNetBuildInput)).toThrow(GeneratorValidationError);
        const wrongBase = mutableClone(cube());
        wrongBase.planarFaces[0].baseEdgeIndex = 9;
        expect(() => buildPolyhedralNetProblem(wrongBase)).toThrow(GeneratorValidationError);
        const wrongAdjacency = mutableClone(cube());
        wrongAdjacency.planarFaces[0].adjacentEdgeIndex = 2;
        expect(() => buildPolyhedralNetProblem(wrongAdjacency)).toThrow(GeneratorValidationError);
        const wrongTree = mutableClone(cube());
        wrongTree.hingeEdges[0].edgeIndex = -1;
        expect(() => buildPolyhedralNetProblem(wrongTree)).toThrow(GeneratorValidationError);
    });
});
