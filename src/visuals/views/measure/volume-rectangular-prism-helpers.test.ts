import {describe, expect, it} from 'vitest';
import {VolumeRectangularPrismGenerator} from '../../../generators/measurement/volume-rectangular-prism/generator.ts';
import {setSeed} from '../../../lib/random.ts';
import type {RectangularPrismVolumeProblem} from '../../../types/problems.ts';
import {assembledPrismFaces, prismViewport} from './volume-unit-cube-helpers.ts';
import {isValidRectangularPrismVolume, prismExpression} from './volume-rectangular-prism-helpers.ts';

const profiles = [
    'packing-equivalence', 'triple-product', 'associative-triple-product',
    'edge-formula', 'base-area-formula'
] as const;

const fixture = (relationProfile: typeof profiles[number], seed = 17): RectangularPrismVolumeProblem => {
    setSeed(`${relationProfile}-${seed}`);
    return new VolumeRectangularPrismGenerator().generate({relationProfile}).data;
};

describe('rectangular-prism view contract', () => {
    it.each(profiles)('accepts the complete %s producer payload', relationProfile => {
        for (let seed = 0; seed < 30; seed++) {
            const data = fixture(relationProfile, seed);
            expect(isValidRectangularPrismVolume(data)).toBe(true);
            expect(prismExpression(data).answer).toBe(`V = ${data.volumeCubicUnits} u³`);
        }
    });

    it('rejects missing, duplicate, reordered, and out-of-bounds cells', () => {
        const data = fixture('packing-equivalence');
        expect(isValidRectangularPrismVolume({...data, occupiedCells: data.occupiedCells.slice(1)})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, occupiedCells: [
            data.occupiedCells[0]!, ...data.occupiedCells.slice(0, -1)
        ]})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, occupiedCells: [
            data.occupiedCells[1]!, data.occupiedCells[0]!, ...data.occupiedCells.slice(2)
        ]})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, dimensions: {...data.dimensions, length: 5 as 4}})).toBe(false);
    });

    it('rejects false layer, measured-input, product, and counted-packing witnesses', () => {
        const data = fixture('packing-equivalence');
        expect(isValidRectangularPrismVolume({...data, baseAreaSquareUnits: 100})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, volumeCubicUnits: 100})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, heightLayers: [
            {...data.heightLayers[0]!, cubeCount: 1}, ...data.heightLayers.slice(1)
        ]})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, measuredInput: {
            kind: 'base-area-height', baseAreaSquareUnits: 100, heightUnits: data.dimensions.height
        }})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, countedPackingEquivalence: {
            ...data.countedPackingEquivalence!, countedCubes: data.cubeCount - 1
        }})).toBe(false);
    });

    it('rejects a false triple-product or associativity grouping', () => {
        const data = fixture('associative-triple-product');
        expect(isValidRectangularPrismVolume({...data, modeledTripleProduct: {
            ...data.modeledTripleProduct!, product: data.volumeCubicUnits + 1
        }})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, associativeRegrouping: {
            ...data.associativeRegrouping!, widthHeightProduct: 999
        }})).toBe(false);
        expect(isValidRectangularPrismVolume({...data, associativeRegrouping: {
            ...data.associativeRegrouping!, columnSlices: [
                {...data.associativeRegrouping!.columnSlices[0]!,
                    cells: data.associativeRegrouping!.columnSlices[0]!.cells.slice(1)},
                ...data.associativeRegrouping!.columnSlices.slice(1)
            ]
        }})).toBe(false);
    });

    it('keeps every unit face in the SVG viewport at maximum prism bounds', () => {
        const bounds = {columns: 4, rows: 3, layers: 3};
        const viewport = prismViewport(bounds);
        const faces = assembledPrismFaces(bounds);
        expect(faces).toHaveLength(4 * 3 + 4 * 3 + 3 * 3);
        for (const face of faces) {
            for (const point of face.points) {
                expect(point.x).toBeGreaterThan(0);
                expect(point.x).toBeLessThan(viewport.width);
                expect(point.y).toBeGreaterThan(0);
                expect(point.y).toBeLessThan(viewport.height);
            }
        }
    });
});
