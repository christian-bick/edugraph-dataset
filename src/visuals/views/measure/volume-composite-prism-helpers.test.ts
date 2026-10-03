import {describe, expect, it} from 'vitest';
import {VolumeCompositePrismsGenerator} from '../../../generators/measurement/volume-composite-prisms/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import type {CompositePrismVolumeProblem} from '../../../types/problems.ts';
import {prismViewport} from './volume-unit-cube-helpers.ts';
import {
    compositeBounds, compositeCells, exposedCompositeFaces, isValidCompositePrism
} from './volume-composite-prism-helpers.ts';

const fixture = (
    calculationModel: 'partition-additivity' | 'component-products-plus-sum', seed = 27
): CompositePrismVolumeProblem => {
    setSeed(`${calculationModel}-${seed}`);
    return new VolumeCompositePrismsGenerator().generate({calculationModel}).data;
};

describe('composite prism contract and geometry', () => {
    it.each(['partition-additivity', 'component-products-plus-sum'] as const)(
        'accepts exact %s producer payloads over seeded shapes', calculationModel => {
            for (let seed = 0; seed < 60; seed++) {
                const data = fixture(calculationModel, seed);
                expect(isValidCompositePrism(data)).toBe(true);
                const cells = compositeCells(data);
                expect(cells).toHaveLength(data.volumeSum.totalCubicUnits);
                expect(new Set(cells.map(({cell}) => `${cell.column}-${cell.row}-${cell.layer}`)).size)
                    .toBe(cells.length);
            }
        }
    );

    it('rejects false origins, shared face, unequal depths, volumes, and optional equations', () => {
        const data = fixture('component-products-plus-sum');
        const [left, right] = data.parts;
        expect(isValidCompositePrism({...data, parts: [left, {
            ...right, origin: {...right.origin, column: left.dimensions.length - 1}
        }]})).toBe(false);
        expect(isValidCompositePrism({...data, parts: [left, {
            ...right, dimensions: {...right.dimensions, depth: left.dimensions.depth === 2 ? 3 : 2}
        }]})).toBe(false);
        expect(isValidCompositePrism({...data, sharedFace: {
            ...data.sharedFace, areaSquareUnits: data.sharedFace.areaSquareUnits + 1
        }})).toBe(false);
        expect(isValidCompositePrism({...data, volumeSum: {
            ...data.volumeSum, totalCubicUnits: data.volumeSum.totalCubicUnits - 1
        }})).toBe(false);
        expect(isValidCompositePrism({...data, calculationEvidence: {
            ...data.calculationEvidence!, sumEquation: {
                ...data.calculationEvidence!.sumEquation, resultCubicUnits: -1
            }
        }})).toBe(false);
    });

    it('does not draw the interior shared face as an exposed cube face', () => {
        for (let seed = 0; seed < 30; seed++) {
            const data = fixture('partition-additivity', seed);
            const [left, right] = data.parts;
            const sharedHeight = Math.min(left.dimensions.height, right.dimensions.height);
            const faces = exposedCompositeFaces(data);
            expect(faces.some(face => face.partId === 'left' && face.surface === 'right'
                && face.cell.column === left.dimensions.length - 1
                && face.cell.layer < sharedHeight)).toBe(false);
            const {width, height} = prismViewport(compositeBounds(data));
            for (const face of faces) {
                for (const point of face.points) {
                    expect(point.x).toBeGreaterThan(0);
                    expect(point.x).toBeLessThan(width);
                    expect(point.y).toBeGreaterThan(0);
                    expect(point.y).toBeLessThan(height);
                }
            }
        }
    });
});
