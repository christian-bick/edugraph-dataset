import {describe, expect, it} from 'vitest';
import type {UnitCubeVolumeProblem} from '../../../types/problems.ts';
import {
    assembledPrismFaces, isValidUnitCubeVolume, projectCubeCorner, prismViewport, volumeUnit
} from './volume-unit-cube-helpers.ts';

const fixture = (bounds: UnitCubeVolumeProblem['bounds'], unitId: UnitCubeVolumeProblem['unitId'] = 'generic'):
UnitCubeVolumeProblem => {
    const occupiedCells = [];
    for (let layer = 0; layer < bounds.layers; layer++) {
        for (let row = 0; row < bounds.rows; row++) {
            for (let column = 0; column < bounds.columns; column++) {
                occupiedCells.push({column, row, layer});
            }
        }
    }
    return {
        kind: 'unit-cube-packing', unitId, unitCubeEdgeLength: 1,
        bounds, occupiedCells, cubeCount: occupiedCells.length
    };
};

describe('unit-cube packing contract', () => {
    it.each(['generic', 'cm', 'in', 'ft'] as const)('accepts complete %s occupancy', unitId => {
        expect(isValidUnitCubeVolume(fixture({columns: 4, rows: 3, layers: 2}, unitId))).toBe(true);
        expect(volumeUnit(unitId).cubic).toMatch(/³$/);
    });

    it('rejects a wrong count, missing cell, repeated cell, wrong order, and invalid edge or unit', () => {
        const data = fixture({columns: 3, rows: 2, layers: 2});
        expect(isValidUnitCubeVolume({...data, cubeCount: 11})).toBe(false);
        expect(isValidUnitCubeVolume({...data, occupiedCells: data.occupiedCells.slice(0, -1)})).toBe(false);
        expect(isValidUnitCubeVolume({...data, occupiedCells: [data.occupiedCells[0]!, ...data.occupiedCells.slice(0, -1)]})).toBe(false);
        expect(isValidUnitCubeVolume({...data, occupiedCells: [data.occupiedCells[1]!, data.occupiedCells[0]!, ...data.occupiedCells.slice(2)]})).toBe(false);
        expect(isValidUnitCubeVolume({...data, unitCubeEdgeLength: 2 as 1})).toBe(false);
        expect(isValidUnitCubeVolume({...data, unitId: 'yard' as 'generic'})).toBe(false);
        expect(isValidUnitCubeVolume({...data, bounds: {columns: 5 as 4, rows: 2, layers: 1}})).toBe(false);
    });

    it('accepts an exact optional counting trace and rejects an untruthful one', () => {
        const data = fixture({columns: 3, rows: 2, layers: 2});
        const countingTrace = data.occupiedCells.map((cell, index) => ({cell, ordinal: index + 1}));
        expect(isValidUnitCubeVolume({...data, countingTrace})).toBe(true);
        expect(isValidUnitCubeVolume({...data, countingTrace: countingTrace.slice(1)})).toBe(false);
        expect(isValidUnitCubeVolume({...data, countingTrace: [
            {...countingTrace[0]!, ordinal: 2}, ...countingTrace.slice(1)
        ]})).toBe(false);
        expect(isValidUnitCubeVolume({...data, countingTrace: [
            {...countingTrace[0]!, cell: data.occupiedCells[1]!}, ...countingTrace.slice(1)
        ]})).toBe(false);
    });
});

describe('isometric unit-cube geometry', () => {
    it.each([
        {columns: 2, rows: 2, layers: 1},
        {columns: 4, rows: 3, layers: 2},
        {columns: 4, rows: 3, layers: 1}
    ] as const)('keeps every exterior face inside SVG bounds for $columns × $rows × $layers', bounds => {
        const {width, height} = prismViewport(bounds);
        const faces = assembledPrismFaces(bounds);
        expect(faces).toHaveLength(bounds.columns * bounds.rows
            + bounds.columns * bounds.layers + bounds.rows * bounds.layers);
        for (const face of faces) {
            expect(face.points).toHaveLength(4);
            for (const point of face.points) {
                expect(point.x).toBeGreaterThan(0);
                expect(point.x).toBeLessThan(width);
                expect(point.y).toBeGreaterThan(0);
                expect(point.y).toBeLessThan(height);
            }
        }
    });

    it('projects the three unit edge directions to equal isometric lengths', () => {
        const bounds = {columns: 3, rows: 2, layers: 2};
        const origin = projectCubeCorner(bounds, 0, 0, 0);
        const directions = [
            projectCubeCorner(bounds, 1, 0, 0),
            projectCubeCorner(bounds, 0, 1, 0),
            projectCubeCorner(bounds, 0, 0, 1)
        ];
        const lengths = directions.map(point => Math.hypot(point.x - origin.x, point.y - origin.y));
        expect(Math.max(...lengths) - Math.min(...lengths)).toBeLessThan(0.5);
    });
});
