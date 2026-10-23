import {describe, expect, it} from 'vitest';
import type {NetFaceGeometry, PolyhedralNetGeometryInput} from './polyhedral-net-geometry-helpers.ts';
import {buildNetFaceMeasure, buildPolyhedralNetGeometry, isPolyhedralNetGeometry} from './polyhedral-net-geometry-helpers.ts';
import {makePolyhedralNetCatalogInput} from './polyhedral-net-catalog.ts';
import type {NetPoint2, NetPoint3, NetScalar} from '../../types/problems.ts';

const q = (numerator: number, denominator = 1): NetScalar => ({numerator, denominator});
const p2 = (x: number, y: number): NetPoint2 => ({x: q(x), y: q(y)});
const p3 = (x: number, y: number, z: number): NetPoint3 => ({x: q(x), y: q(y), z: q(z)});
const clone = <T,>(value: T): T => structuredClone(value);
const nonempty = <T,>(values: readonly T[]): readonly [T, ...T[]] => {if (!values.length) throw Error('fixture'); return [values[0]!, ...values.slice(1)];};
/** Independent literal tetrahedron, with three different rational altitudes and one nonzero offset. */
const tetra = (): PolyhedralNetGeometryInput => ({
    solidKind: 'triangular-pyramid', solid: {
        vertices: [{vertexId: 'A', point: p3(0, 0, 0)}, {vertexId: 'B', point: p3(3, 0, 0)}, {vertexId: 'C', point: p3(0, 4, 0)}, {vertexId: 'D', point: p3(0, 0, 1)}],
        faces: [{faceId: 'base', shape: 'triangle', vertexIds: ['A', 'C', 'B']}, {faceId: 'front', shape: 'triangle', vertexIds: ['A', 'B', 'D']},
            {faceId: 'left', shape: 'triangle', vertexIds: ['A', 'D', 'C']}, {faceId: 'slope', shape: 'triangle', vertexIds: ['B', 'C', 'D']}]
    }, planarFaces: [
        {faceId: 'base', vertices: [{solidVertexId: 'A', point: p2(0, 0)}, {solidVertexId: 'C', point: p2(0, 4)}, {solidVertexId: 'B', point: p2(3, 0)}]},
        {faceId: 'front', vertices: [{solidVertexId: 'A', point: p2(0, 0)}, {solidVertexId: 'B', point: p2(3, 0)}, {solidVertexId: 'D', point: p2(0, -1)}]},
        {faceId: 'left', vertices: [{solidVertexId: 'A', point: p2(0, 0)}, {solidVertexId: 'D', point: p2(-1, 0)}, {solidVertexId: 'C', point: p2(0, 4)}]},
        {faceId: 'slope', vertices: [{solidVertexId: 'B', point: p2(3, 0)}, {solidVertexId: 'C', point: p2(0, 4)}, {solidVertexId: 'D', point: p2(4, 3)}]}
    ], hingeEdges: [{faceId: 'base', edgeIndex: 0}, {faceId: 'base', edgeIndex: 1}, {faceId: 'base', edgeIndex: 2}]
});
const catalog = (shape: Parameters<typeof makePolyhedralNetCatalogInput>[0]['shape']) => makePolyhedralNetCatalogInput({shape, scale: q(1), lengthUnit: 'centimeters', mathematicalRelation: 'boundary-incidence'});
const f = (points: readonly [readonly [number, number], readonly [number, number], readonly [number, number], ...readonly [number, number][]]): NetFaceGeometry => {
    const vertices = points.map(([x, y], index) => ({solidVertexId: `v${index}`, point: p2(x, y)}));
    return {faceId: 'literal', vertices: [vertices[0]!, vertices[1]!, vertices[2]!, ...vertices.slice(3)]};
};

describe('exact polyhedral net geometry', () => {
    it('derives the independent tetrahedron edge table, proper folds and 5-by-13/5 sloped face', () => {
        const input = tetra(), saved = JSON.stringify(input), result = buildPolyhedralNetGeometry(input);
        expect(isPolyhedralNetGeometry(result)).toBe(true);
        expect(result.solid.edges).toHaveLength(6);
        expect(result.solid.edges.map(e => e.lengthSquared).sort((a, b) => a.numerator - b.numerator)).toEqual([q(1), q(9), q(10), q(16), q(17), q(25)]);
        expect(result.net.hinges).toHaveLength(3); expect(result.net.cutSeams).toHaveLength(3);
        const slope = result.net.faces.find(f => f.faceId === 'slope')!;
        expect(buildNetFaceMeasure(slope, 0)).toEqual({kind: 'triangle', baseEdgeIndex: 0, apexVertexIndex: 2,
            altitudeFoot: {x: q(48, 25), y: q(36, 25)}, base: q(5), height: q(13, 5), baseOffset: q(9, 5),
            baseHeightProduct: {kind: 'binary', operation: 'multiplication', operands: [q(5), q(13, 5)], result: q(13)},
            halfAreaProduct: {kind: 'binary', operation: 'multiplication', operands: [q(13), q(1, 2)], result: q(13, 2)}, area: q(13, 2)});
        expect(JSON.stringify(input)).toBe(saved);
    });

    it('accepts all six genuine source classes and both sheet windings without catalog-only identity checks', () => {
        for (const shape of ['cube', 'box', 'triangular-prism', 'triangular-pyramid', 'square-pyramid', 'rectangular-pyramid'] as const) {
            const result = buildPolyhedralNetGeometry(catalog(shape));
            expect(isPolyhedralNetGeometry(result)).toBe(true);
            expect(result.net.folds).toHaveLength(result.solid.faces.length);
        }
    });

    it('accepts a different cube hinge tree and congruent sheet pose', () => {
        const input = catalog('cube');
        const alternate: PolyhedralNetGeometryInput = {...input, planarFaces: nonempty(input.planarFaces.map((face): NetFaceGeometry => face.faceId === 'top' ? {...face,
            vertices: [{solidVertexId: 'E', point: p2(1, 2)}, {solidVertexId: 'F', point: p2(1, 1)}, {solidVertexId: 'G', point: p2(2, 1)}, {solidVertexId: 'H', point: p2(2, 2)}]} : face)),
            hingeEdges: [{faceId: 'front', edgeIndex: 1}, {faceId: 'right', edgeIndex: 1}, {faceId: 'back', edgeIndex: 1}, {faceId: 'front', edgeIndex: 0}, {faceId: 'right', edgeIndex: 2}]};
        const geometry = buildPolyhedralNetGeometry(alternate);
        expect(isPolyhedralNetGeometry(geometry)).toBe(true);
        expect(geometry.net.hinges.map(e => e.solidEdgeId)).not.toEqual(buildPolyhedralNetGeometry(input).net.hinges.map(e => e.solidEdgeId));
    });

    it('derives exact proper folds under rational 3D rotation, translation and cyclic source/net rotations', () => {
        const input = tetra();
        const transform = ({x, y, z}: NetPoint3): NetPoint3 => ({x: q((3 * x.numerator - 4 * y.numerator) + 35, 5), y: q((4 * x.numerator + 3 * y.numerator) - 55, 5), z: q(z.numerator + 2)});
        // Reduce the deliberately rational transformed coordinates independently.
        const reduce = (v: NetScalar): NetScalar => {let a = Math.abs(v.numerator), b = v.denominator; while (b) [a, b] = [b, a % b]; return q(v.numerator / a, v.denominator / a);};
        const rotated = {...input, solid: {...input.solid, vertices: nonempty(input.solid.vertices.map(v => {const p = transform(v.point); return {...v, point: {x: reduce(p.x), y: reduce(p.y), z: p.z}};}))}};
        const result = buildPolyhedralNetGeometry(rotated), changed = clone(result);
        const cycle = <T,>(rows: readonly T[]) => [...rows.slice(1), rows[0]!];
        const faces = changed.solid.faces.map(face => ({...face, vertexIds: cycle(face.vertexIds)}));
        const incidences = (entries: readonly {faceId: string; edgeIndex: number}[]) => entries.map(i => ({...i, edgeIndex: (i.edgeIndex + 2) % 3}));
        const renamed = {...changed, solid: {...changed.solid, faces: faces.reverse(), vertices: [...changed.solid.vertices].reverse(),
            edges: [...changed.solid.edges].reverse().map(e => ({...e, vertexIds: [...e.vertexIds].reverse(), incidences: incidences(e.incidences).reverse()}))}, net: {...changed.net,
            faces: [...changed.net.faces].reverse().map(face => ({...face, vertices: cycle(face.vertices)})), folds: [...changed.net.folds].reverse(),
            hinges: changed.net.hinges.map(p => ({...p, incidences: incidences(p.incidences).reverse()})), cutSeams: changed.net.cutSeams.map(p => ({...p, incidences: incidences(p.incidences).reverse()}))}};
        expect(isPolyhedralNetGeometry(renamed)).toBe(true);
    });

    it('rejects reflected folds even though they map every z=0 face vertex identically', () => {
        const data = buildPolyhedralNetGeometry(tetra()), first = data.net.folds[0];
        const reflection = first.rotation.map(row => [row[0], row[1], {...row[2], numerator: row[2].numerator === 0 ? 0 : -row[2].numerator}]);
        expect(isPolyhedralNetGeometry({...data, net: {...data.net, folds: [{...first, rotation: reflection}, ...data.net.folds.slice(1)]}})).toBe(false);
        expect(isPolyhedralNetGeometry({...data, net: {...data.net, folds: [{...first, translation: p3(1, 1, 1)}, ...data.net.folds.slice(1)]}})).toBe(false);
        expect(isPolyhedralNetGeometry({...data, net: {...data.net, folds: [{...first, rotation: [[q(0), q(0), q(0)], [q(0), q(0), q(0)], [q(0), q(0), q(0)]]}, ...data.net.folds.slice(1)]}})).toBe(false);
    });

    it('rejects open, inward, wrong-class, duplicate and incongruent source geometry', () => {
        const input = tetra(), result = buildPolyhedralNetGeometry(input);
        const invalid = [
            {...input, solidKind: 'not-a-solid'}, {...input, solid: {...input.solid, faces: input.solid.faces.slice(1)}},
            {...input, solid: {...input.solid, faces: [{...input.solid.faces[0], vertexIds: ['A', 'B', 'C']}, ...input.solid.faces.slice(1)]}},
            {...input, solid: {...input.solid, vertices: [{...input.solid.vertices[0], point: p3(3, 0, 0)}, ...input.solid.vertices.slice(1)]}},
            {...input, solid: {...input.solid, faces: [input.solid.faces[0], input.solid.faces[0], ...input.solid.faces.slice(2)]}},
            {...input, planarFaces: [{...input.planarFaces[0], vertices: [...input.planarFaces[0].vertices].reverse()}, ...input.planarFaces.slice(1)]},
            {...input, planarFaces: input.planarFaces.map(face => face.faceId === 'slope' ? {...face, vertices: [...face.vertices.slice(0, 2), {solidVertexId: 'D', point: p2(5, 3)}]} : face)}
        ];
        for (const bad of invalid) expect(() => buildPolyhedralNetGeometry(bad as PolyhedralNetGeometryInput)).toThrow();
        expect(isPolyhedralNetGeometry({...result, solid: {...result.solid, edges: result.solid.edges.map((edge, index) => index ? edge : {...edge, lengthSquared: q(99)})}})).toBe(false);
        expect(isPolyhedralNetGeometry({...result, solid: {...result.solid, edges: result.solid.edges.map((edge, index) => index ? edge : {...edge, incidences: [edge.incidences[0], edge.incidences[0]]})}})).toBe(false);
    });

    it('rejects overlapping sheet faces, disconnected/duplicate hinges and missing cut seams', () => {
        const input = tetra(), data = buildPolyhedralNetGeometry(input);
        const front = input.planarFaces[1];
        const overlapping: PolyhedralNetGeometryInput = {...input, planarFaces: nonempty(input.planarFaces.map((face): NetFaceGeometry => face.faceId === 'front' ? {...front, vertices: [{solidVertexId: 'A', point: p2(0, 0)}, {solidVertexId: 'B', point: p2(3, 0)}, {solidVertexId: 'D', point: p2(0, 1)}]} : face))};
        expect(() => buildPolyhedralNetGeometry(overlapping)).toThrow();
        expect(() => buildPolyhedralNetGeometry({...input, hingeEdges: [input.hingeEdges[0], input.hingeEdges[0], input.hingeEdges[1]]})).toThrow();
        expect(isPolyhedralNetGeometry({...data, net: {...data.net, hinges: [data.net.hinges[0], ...data.net.cutSeams.slice(0, 2)], cutSeams: [...data.net.hinges.slice(1), data.net.cutSeams[2]]}})).toBe(false);
        expect(isPolyhedralNetGeometry({...data, net: {...data.net, cutSeams: data.net.cutSeams.slice(1)}})).toBe(false);
        expect(isPolyhedralNetGeometry({...data, net: {...data.net, folds: [data.net.folds[0], data.net.folds[0], ...data.net.folds.slice(2)]}})).toBe(false);
    });

    it('derives signed external/zero offsets, reverse rectangle neighbors and wide-safe rational measures', () => {
        for (const offset of [-1, 0, 3]) {
            const result = buildNetFaceMeasure(f([[0, 0], [2, 0], [offset, 1]]), 0);
            expect(result.kind === 'triangle' && result.baseOffset).toEqual(q(offset));
            expect(result.area).toEqual(q(1));
        }
        const rectangle = f([[0, 0], [100_000_000, 0], [100_000_000, 1], [0, 1]]);
        expect(buildNetFaceMeasure(rectangle, 0, 3)).toMatchObject({base: q(100_000_000), height: q(1), area: q(100_000_000)});
        expect(buildNetFaceMeasure(f([[0, 0], [100_000_000, 0], [50_000_000, 1]]), 0).area).toEqual(q(50_000_000));
        for (const args of [[rectangle, -0, 1], [rectangle, 0, 2], [f([[0, 0], [1, 1], [0, 2]]), 0, undefined], [f([[0, 0], [1, 0], [2, 0]]), 0, undefined]] as const) expect(() => buildNetFaceMeasure(args[0], args[1], args[2])).toThrow();
    });

    it('is total for sparse/huge arrays, inherited elements, getters and cyclic malformed objects', () => {
        const valid = buildPolyhedralNetGeometry(tetra()), sparse = [...valid.net.faces]; delete sparse[0];
        const inherited = [...valid.net.faces]; delete inherited[0]; Object.setPrototypeOf(inherited, Object.assign(Object.create(Array.prototype), {0: valid.net.faces[0]}));
        const getter = Object.defineProperty({}, 'solid', {get() {throw Error('hostile');}}), cycle: Record<string, unknown> = {}; cycle.solid = cycle;
        for (const value of [null, undefined, [], {}, getter, cycle, {...valid, net: {...valid.net, faces: sparse}}, {...valid, net: {...valid.net, faces: inherited}}, {...valid, net: {...valid.net, folds: new Array(2 ** 32 - 1)}}, {...valid, solid: {...valid.solid, vertices: new Array(2 ** 32 - 1)}}]) expect(isPolyhedralNetGeometry(value)).toBe(false);
    });
});
