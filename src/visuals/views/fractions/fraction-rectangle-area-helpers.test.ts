import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {FractionRectangleAreaGenerator} from '../../../generators/fraction/fraction-rectangle-area/generator.ts';
import type {FractionRectangleAreaProblem} from '../../../types/problems.ts';
import {isValidFractionRectangleArea, rectangleGridGeometry} from './fraction-rectangle-area-helpers.ts';

const generator = new FractionRectangleAreaGenerator();
const sample = (areaJustification: 'fraction-side-product' | 'square-tile-proof', seed: number) => {
    setSeed(`fraction-rectangle-view-${areaJustification}-${seed}`);
    return generator.generate({areaJustification}).data;
};

describe('fraction rectangle view contract', () => {
    it('accepts both exact producer profiles across seeds', () => {
        for (const profile of ['fraction-side-product', 'square-tile-proof'] as const) {
            for (let seed = 0; seed < 40; seed++) {
                const data = sample(profile, seed);
                expect(isValidFractionRectangleArea(data)).toBe(true);
                expect(data.tileProof !== undefined).toBe(profile === 'square-tile-proof');
                expect(data.tileGrid.rows * data.tileGrid.columns).toBe(data.tileGrid.cells.length);
            }
        }
    });

    it('rejects a rebased square instead of the canonical unit-fraction tile', () => {
        const data = sample('square-tile-proof', 0);
        const tile = data.tileGrid.squareTile;
        expect(isValidFractionRectangleArea({...data, tileGrid: {...data.tileGrid,
            squareTile: {...tile, side: {numerator: 2, denominator: tile.side.denominator * 2}}
        }})).toBe(false);
        expect(isValidFractionRectangleArea({...data, tileGrid: {...data.tileGrid,
            squareTile: {...tile, areaSquareUnits: {numerator: 2,
                denominator: tile.areaSquareUnits.denominator * 2}}
        }})).toBe(false);
    });

    it('rejects missing, duplicated, or displaced cells and false exact equations', () => {
        const data = sample('square-tile-proof', 1);
        expect(isValidFractionRectangleArea({...data, tileGrid: {...data.tileGrid,
            cells: data.tileGrid.cells.slice(1)}})).toBe(false);
        expect(isValidFractionRectangleArea({...data, tileGrid: {...data.tileGrid,
            cells: [{row: 0, column: 0}, ...data.tileGrid.cells.slice(0, -1)]}})).toBe(false);
        expect(isValidFractionRectangleArea({...data, tileGrid: {...data.tileGrid,
            partitionDenominator: data.tileGrid.partitionDenominator + 1}})).toBe(false);
        expect(isValidFractionRectangleArea({...data, areaSquareUnits: {numerator: 11, denominator: 1}})).toBe(false);
        expect(isValidFractionRectangleArea({...data, tileProof: {...data.tileProof!,
            countedAreaSquareUnits: {numerator: 11, denominator: 1}}})).toBe(false);
        expect(isValidFractionRectangleArea({...data, tileProof: {...data.tileProof!,
            tileCount: data.tileGrid.tileCount + 1}})).toBe(false);
    });

    it('keeps equal horizontal and vertical pixels per tile, including blank construction', () => {
        const data: FractionRectangleAreaProblem = sample('fraction-side-product', 4);
        for (const blank of [false, true]) {
            const geometry = rectangleGridGeometry(data, blank);
            const horizontal = (geometry.viewWidth - geometry.plotX - 38) / geometry.gridColumns;
            const vertical = (geometry.viewHeight - geometry.plotY - 82) / geometry.gridRows;
            expect(horizontal).toBeCloseTo(geometry.tilePixels);
            expect(vertical).toBeCloseTo(geometry.tilePixels);
            expect(horizontal).toBeCloseTo(vertical);
        }
    });
});
