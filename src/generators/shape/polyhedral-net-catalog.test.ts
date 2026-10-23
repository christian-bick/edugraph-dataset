import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../lib/errors.ts';
import {makePolyhedralNetCatalogInput, type PolyhedralNetCatalogOptions, type PolyhedralNetCatalogShape} from './polyhedral-net-catalog.ts';
import {buildPolyhedralNetProblem, isPolyhedralNetProblem} from './polyhedral-net-helpers.ts';

const q = (numerator: number, denominator = 1) => ({numerator, denominator});
const options = (shape: PolyhedralNetCatalogShape): PolyhedralNetCatalogOptions => ({shape, scale: q(1), lengthUnit: 'centimeters', mathematicalRelation: 'surface-additivity'});
const oracles = [
    {shape: 'cube', vertices: 8, faces: 6, edges: 12, area: 6, faceAreas: [1, 1, 1, 1, 1, 1]},
    {shape: 'box', vertices: 8, faces: 6, edges: 12, area: 52, faceAreas: [6, 6, 8, 12, 8, 12]},
    {shape: 'triangular-prism', vertices: 6, faces: 5, edges: 9, area: 36, faceAreas: [6, 6, 6, 10, 8]},
    {shape: 'triangular-pyramid', vertices: 4, faces: 4, edges: 6, area: 16, faceAreas: [6, 1.5, 2, 6.5]},
    {shape: 'square-pyramid', vertices: 5, faces: 5, edges: 8, area: 96, faceAreas: [36, 15, 15, 15, 15]},
    {shape: 'rectangular-pyramid', vertices: 5, faces: 5, edges: 8, area: 564, faceAreas: [180, 75, 117, 75, 117]}
] as const;

describe('exact polyhedral net catalog', () => {
    it.each(oracles)('matches independent source and area facts for $shape', row => {
        const input = makePolyhedralNetCatalogInput(options(row.shape));
        const data = buildPolyhedralNetProblem(input);
        expect(data.surfaceArea).toEqual(q(row.area));
        expect(data.solid.vertices).toHaveLength(row.vertices);
        expect(data.solid.faces).toHaveLength(row.faces);
        expect(data.solid.edges).toHaveLength(row.edges);
        expect(data.net.hinges).toHaveLength(row.faces - 1);
        expect(data.net.cutSeams).toHaveLength(row.edges - row.faces + 1);
        expect(data.net.faces.map(face => face.measure.area.numerator / face.measure.area.denominator)).toEqual(row.faceAreas);
        expect(data.surfaceAdditivity.at(-1)?.arithmetic.result).toEqual(q(row.area));
        expect(isPolyhedralNetProblem(data)).toBe(true);
        expect(JSON.stringify(data)).not.toMatch(/mathematicalRelation|question|blankPart|prompt|ability/i);
    });

    it('supplies the independent nonintegral tetrahedral altitude, signed offset and proper fold', () => {
        const data = buildPolyhedralNetProblem(makePolyhedralNetCatalogInput(options('triangular-pyramid')));
        const face = data.net.faces.find(row => row.faceId === 'side-BC')!;
        expect(face.measure).toMatchObject({kind: 'triangle', base: q(5), height: q(13, 5), baseOffset: q(9, 5),
            altitudeFoot: {x: q(48, 25), y: q(36, 25)}, area: q(13, 2)});
        const fold = data.net.folds.find(row => row.faceId === 'side-BC')!;
        expect(fold.rotation).toEqual([
            [q(-3, 13), q(-12, 13), q(-4, 13)],
            [q(-12, 13), q(4, 13), q(-3, 13)],
            [q(4, 13), q(3, 13), q(-12, 13)]
        ]);
        expect(fold.translation).toEqual({x: q(48, 13), y: q(36, 13), z: q(-12, 13)});
    });

    it('scales exact lengths linearly and every independent area quadratically across both units and relations', () => {
        for (const row of oracles) for (const [n, d] of [[1, 4], [2, 3], [3, 2], [6, 1]] as const) {
            for (const lengthUnit of ['centimeters', 'meters'] as const) {
                const input = makePolyhedralNetCatalogInput({...options(row.shape), scale: q(n, d), lengthUnit, mathematicalRelation: 'boundary-incidence'});
                const data = buildPolyhedralNetProblem(input);
                expect(BigInt(data.surfaceArea.numerator) * BigInt(d * d)).toBe(BigInt(row.area * n * n) * BigInt(data.surfaceArea.denominator));
                expect(data.unit).toEqual({length: lengthUnit, area: lengthUnit === 'meters' ? 'square-meters' : 'square-centimeters'});
                expect(data.surfaceAdditivity).toEqual([]);
                expect(isPolyhedralNetProblem(data)).toBe(true);
            }
        }
    });

    it('is pure with fixed source-dependent context and a fixed literal cut tree', () => {
        const config = options('box');
        const before = JSON.stringify(config);
        const first = makePolyhedralNetCatalogInput(config);
        expect(makePolyhedralNetCatalogInput(config)).toEqual(first);
        expect(JSON.stringify(config)).toBe(before);
        expect(first.context).toEqual({kind: 'closed-carton', boundary: 'all-external-faces'});
        expect(makePolyhedralNetCatalogInput(options('square-pyramid')).context.kind).toBe('closed-solid-model');
        expect(first).not.toHaveProperty('surfaceArea');
        expect(first).not.toHaveProperty('folds');
        expect(first.planarFaces.every(row => !Object.hasOwn(row, 'measure'))).toBe(true);
    });

    it('does not impose safe storage on hidden boundary-only area prefixes', () => {
        const p = 90000001;
        const input = makePolyhedralNetCatalogInput({...options('cube'), scale: q(p, 6), mathematicalRelation: 'boundary-incidence'});
        const data = buildPolyhedralNetProblem(input);
        const square = Number(BigInt(p) ** 2n);
        expect(data.net.faces.every(face => face.measure.area.numerator === square && face.measure.area.denominator === 36)).toBe(true);
        expect(data.surfaceArea).toEqual(q(square, 6));
        expect(data.surfaceAdditivity).toEqual([]);
        expect(isPolyhedralNetProblem(data)).toBe(true);
        // This prefix would have to be represented by the selected proof branch.
        expect(5n * BigInt(square)).toBeGreaterThan(BigInt(Number.MAX_SAFE_INTEGER));
        expect(() => buildPolyhedralNetProblem({...input, mathematicalRelation: 'surface-additivity'})).toThrow(GeneratorValidationError);
    });

    it('rejects malformed or unsafe scale/configuration without fallback values', () => {
        const invalid = [undefined, null, {}, {...options('cube'), shape: 'sphere'},
            {...options('cube'), scale: q(0)}, {...options('cube'), scale: q(-1)},
            {...options('cube'), scale: q(-0)}, {...options('cube'), scale: q(2, 2)},
            {...options('cube'), scale: q(1, 0)}, {...options('cube'), lengthUnit: 'feet'},
            {...options('cube'), mathematicalRelation: 'surface-area-task'}];
        for (const value of invalid) expect(() => makePolyhedralNetCatalogInput(value as PolyhedralNetCatalogOptions)).toThrow(GeneratorValidationError);
        expect(() => makePolyhedralNetCatalogInput({...options('box'), scale: q(Number.MAX_SAFE_INTEGER)})).toThrow(GeneratorValidationError);
    });
});
