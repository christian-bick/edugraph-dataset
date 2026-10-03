import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {UnitCubeCell} from '../../../types/problems.ts';
import {VolumeUnitCubesGenerator} from './generator.ts';

describe('VolumeUnitCubesGenerator', () => {
    const generator = new VolumeUnitCubesGenerator();

    it.each((['generic', 'cm', 'in', 'ft'] as const).flatMap(unitId =>
        (['unindexed', 'enumerated'] as const).map(countingModel => ({unitId, countingModel}))))
    ('fills the complete $unitId unit-cube grid with $countingModel counting', ({unitId, countingModel}) => {
        const shapes = new Set<string>();
        for (let seed = 0; seed < 200; seed++) {
            setSeed(seed);
            const data = generator.generate({unitId, countingModel}).data;
            const {columns, rows, layers} = data.bounds;
            const expected: UnitCubeCell[] = [];
            for (let layer = 0; layer < layers; layer++) {
                for (let row = 0; row < rows; row++) {
                    for (let column = 0; column < columns; column++) {
                        expected.push({column, row, layer});
                    }
                }
            }
            expect(data.kind).toBe('unit-cube-packing');
            expect(data.unitId).toBe(unitId);
            expect(data.unitCubeEdgeLength).toBe(1);
            expect([2, 3, 4]).toContain(columns);
            expect([2, 3]).toContain(rows);
            expect([1, 2]).toContain(layers);
            expect(data.occupiedCells).toEqual(expected);
            expect(new Set(data.occupiedCells.map(cell => JSON.stringify(cell))).size).toBe(expected.length);
            expect(data.cubeCount).toBe(columns * rows * layers);
            expect(data.cubeCount).toBe(data.occupiedCells.length);
            expect(data.cubeCount).toBeGreaterThanOrEqual(4);
            expect(data.cubeCount).toBeLessThanOrEqual(24);
            if (countingModel === 'enumerated') {
                expect(data.countingTrace).toEqual(expected.map((cell, index) => ({cell, ordinal: index + 1})));
                expect(new Set(data.countingTrace!.map(item => item.ordinal)).size).toBe(data.cubeCount);
            } else {
                expect(data).not.toHaveProperty('countingTrace');
            }
            shapes.add(`${columns}x${rows}x${layers}`);

            setSeed(seed);
            expect(generator.generate({unitId, countingModel}).data).toEqual(data);
        }
        expect(shapes.size).toBe(12);
    });

    it('rejects empty, malformed, and unsupported unit configuration', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate(null as never)).toThrow();
        for (const unitId of ['', 'meter', 'square-centimeter', 3, undefined, null]) {
            expect(() => generator.generate({unitId, countingModel: 'unindexed'} as never)).toThrow();
        }
        for (const countingModel of ['', 'count', true, undefined, null]) {
            expect(() => generator.generate({unitId: 'generic', countingModel} as never)).toThrow();
        }
    });
});
