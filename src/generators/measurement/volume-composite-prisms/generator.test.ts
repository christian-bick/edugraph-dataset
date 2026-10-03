import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {CompositePrismPart, CompositePrismVolumeProblem} from '../../../types/problems.ts';
import {VolumeCompositePrismsGenerator} from './generator.ts';

const cellKeys = (part: CompositePrismPart): Set<string> => {
    const cells = new Set<string>();
    for (let layer = part.origin.layer; layer < part.origin.layer + part.dimensions.height; layer++) {
        for (let row = part.origin.row; row < part.origin.row + part.dimensions.depth; row++) {
            for (let column = part.origin.column; column < part.origin.column + part.dimensions.length; column++) {
                cells.add(`${column},${row},${layer}`);
            }
        }
    }
    return cells;
};

const expectExactDecomposition = (data: CompositePrismVolumeProblem): void => {
    expect(data.kind).toBe('composite-prism-volume');
    expect(data.unitId).toBe('generic');
    expect(data.parts).toHaveLength(2);
    const [left, right] = data.parts;
    const leftShape = left.dimensions;
    const rightShape = right.dimensions;
    expect(left.id).toBe('left');
    expect(right.id).toBe('right');
    expect(left.origin).toEqual({column: 0, row: 0, layer: 0});
    expect(right.origin).toEqual({column: leftShape.length, row: 0, layer: 0});
    for (const part of [left, right]) {
        expect([2, 3, 4]).toContain(part.dimensions.length);
        expect([2, 3]).toContain(part.dimensions.depth);
        expect([2, 3]).toContain(part.dimensions.height);
        expect(part.volumeCubicUnits).toBe(
            part.dimensions.length * part.dimensions.depth * part.dimensions.height);
        expect(Number.isSafeInteger(part.volumeCubicUnits)).toBe(true);
    }
    expect(leftShape.depth).toBe(rightShape.depth);
    expect(leftShape.height).not.toBe(rightShape.height);

    const leftCells = cellKeys(left);
    const rightCells = cellKeys(right);
    const whole = new Set([...leftCells, ...rightCells]);
    expect([...leftCells].filter(key => rightCells.has(key))).toEqual([]);
    expect(leftCells.size).toBe(left.volumeCubicUnits);
    expect(rightCells.size).toBe(right.volumeCubicUnits);
    expect(whole.size).toBe(left.volumeCubicUnits + right.volumeCubicUnits);
    expect(whole.size).toBeGreaterThanOrEqual(20);
    expect(whole.size).toBeLessThanOrEqual(60);

    const totalLength = leftShape.length + rightShape.length;
    const maxHeight = Math.max(leftShape.height, rightShape.height);
    for (let column = 0; column < totalLength; column++) {
        for (let row = 0; row < leftShape.depth; row++) {
            for (let layer = 0; layer < maxHeight; layer++) {
                const expected = layer < (column < leftShape.length ? leftShape.height : rightShape.height);
                expect(whole.has(`${column},${row},${layer}`)).toBe(expected);
            }
        }
    }

    const sharedHeight = Math.min(leftShape.height, rightShape.height);
    expect(data.sharedFace).toEqual({
        planeColumn: leftShape.length,
        rowSpan: [0, leftShape.depth],
        layerSpan: [0, sharedHeight],
        areaSquareUnits: leftShape.depth * sharedHeight,
        volumeCubicUnits: 0
    });
    expect(data.sharedFace.areaSquareUnits).toBeGreaterThan(0);
    expect(data.volumeSum).toEqual({
        addendsCubicUnits: [left.volumeCubicUnits, right.volumeCubicUnits],
        totalCubicUnits: whole.size
    });
};

describe('VolumeCompositePrismsGenerator', () => {
    const generator = new VolumeCompositePrismsGenerator();

    it.each(['partition-additivity', 'component-products-plus-sum'] as const)(
        'builds an exact connected stepped solid for %s', calculationModel => {
            const shapes = new Set<string>();
            const tallSides = new Set<string>();
            for (let seed = 0; seed < 180; seed++) {
                setSeed(`${calculationModel}-${seed}`);
                const data = generator.generate({calculationModel}).data;
                expectExactDecomposition(data);
                const [left, right] = data.parts;
                shapes.add(`${left.dimensions.length}-${right.dimensions.length}-${left.dimensions.depth}-${left.dimensions.height}-${right.dimensions.height}`);
                tallSides.add(left.dimensions.height > right.dimensions.height ? 'left' : 'right');

                if (calculationModel === 'component-products-plus-sum') {
                    expect(data.calculationEvidence).toEqual({
                        partProducts: [
                            {partId: 'left', factors: [left.dimensions.length, left.dimensions.depth,
                                left.dimensions.height], productCubicUnits: left.volumeCubicUnits},
                            {partId: 'right', factors: [right.dimensions.length, right.dimensions.depth,
                                right.dimensions.height], productCubicUnits: right.volumeCubicUnits}
                        ],
                        sumEquation: {
                            addendsCubicUnits: [left.volumeCubicUnits, right.volumeCubicUnits],
                            resultCubicUnits: data.volumeSum.totalCubicUnits
                        }
                    });
                } else expect(data).not.toHaveProperty('calculationEvidence');

                setSeed(`${calculationModel}-${seed}`);
                expect(generator.generate({calculationModel}).data).toEqual(data);
            }
            expect(shapes.size).toBeGreaterThanOrEqual(24);
            expect(tallSides).toEqual(new Set(['left', 'right']));
        }
    );

    it('rejects missing and unsupported mathematical profiles', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate(null as never)).toThrow();
        for (const calculationModel of ['', 'volume', 'calculate', true, 1]) {
            expect(() => generator.generate({calculationModel} as never))
                .toThrow('Expected a supported composite calculation model.');
        }
        for (const calculationModel of [null, undefined]) {
            expect(() => generator.generate({calculationModel} as never))
                .toThrow('Required field "calculationModel" is missing.');
        }
    });
});
