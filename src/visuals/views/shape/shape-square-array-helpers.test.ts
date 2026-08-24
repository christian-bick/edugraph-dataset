import {describe, expect, it} from 'vitest';
import {
    EqualSquarePartitionProblem,
    RectangleAreaProblem,
    UnitSquareGridProblem
} from '../../../types/problems.ts';
import {
    buildRectangleAreaPresentation,
    buildUnitSquareInversionPresentation,
    getAreaTilePrompt,
    getEqualSquareStoryPrompt,
    getRectangleAreaStoryPrompt,
    getRectangleDiagramGeometry,
    getSquareAreaUnit,
    getUnitSquareStoryPrompt,
    isValidEqualSquarePartitionProblem,
    isValidRectangleAreaProblem,
    isValidUnitSquareGridProblem
} from './shape-square-array-helpers.ts';

const equalSquares: EqualSquarePartitionProblem = {
    kind: 'equal-square-partition',
    rows: 4,
    columns: 5,
    partCount: 20
};
const unitGrid: UnitSquareGridProblem = {
    kind: 'unit-square-grid',
    rows: 4,
    columns: 5,
    tileCount: 20,
    unitId: 'square-centimeter'
};
const rectangle: RectangleAreaProblem = {
    kind: 'rectangle-area',
    length: 5,
    width: 4,
    area: 20,
    unitId: 'square-unit'
};

describe('shape-square-array problem validation', () => {
    it('accepts each canonical mathematical family', () => {
        expect(isValidEqualSquarePartitionProblem(equalSquares)).toBe(true);
        expect(isValidUnitSquareGridProblem(unitGrid)).toBe(true);
        expect(isValidUnitSquareGridProblem({
            kind: 'unit-square-grid',
            rows: 1,
            columns: 1,
            tileCount: 1,
            unitId: 'square-unit'
        })).toBe(true);
        expect(isValidRectangleAreaProblem(rectangle)).toBe(true);
    });

    it('rejects inconsistent products, partial unit grids, and square rectangles', () => {
        expect(isValidEqualSquarePartitionProblem({...equalSquares, partCount: 19})).toBe(false);
        expect(isValidUnitSquareGridProblem({...unitGrid, rows: 1})).toBe(false);
        expect(isValidUnitSquareGridProblem({...unitGrid, tileCount: 19})).toBe(false);
        expect(isValidRectangleAreaProblem({...rectangle, area: 19})).toBe(false);
        expect(isValidRectangleAreaProblem({
            ...rectangle,
            length: 5,
            width: 5,
            area: 25
        })).toBe(false);
    });
});

describe('shape-square-array projections', () => {
    it('derives direct and inverse rectangle equations from one relation', () => {
        const direct = buildRectangleAreaPresentation(rectangle, 'calculate-area', 2);
        const inverse = buildRectangleAreaPresentation(
            rectangle,
            'find-missing-area-dimension',
            2
        );

        expect(direct.questionEquation).toBe('A = 5 × 4 = ?');
        expect(direct.solutionEquation).toBe('A = 5 × 4 = 20');
        expect(inverse.task).toBe('find-missing-area-dimension');
        if (inverse.task !== 'find-missing-area-dimension') {
            throw new Error('Expected inverse presentation.');
        }
        expect(inverse.unknownDimension).toBe('length');
        expect(inverse.inverseEquation).toBe('20 ÷ 4 = ?');
        expect(inverse.solutionEquation).toBe('20 ÷ 4 = 5');
    });

    it('uses the render seed to vary the unknown dimension', () => {
        const even = buildUnitSquareInversionPresentation(unitGrid, 2);
        const odd = buildUnitSquareInversionPresentation(unitGrid, 3);
        expect(even.unknownDimension).toBe('length');
        expect(odd.unknownDimension).toBe('width');
    });

    it.each([
        ['square-unit', '1 square unit', 'square units'],
        ['square-centimeter', '1 square centimeter', 'square centimeters'],
        ['square-meter', '1 square meter', 'square meters'],
        ['square-inch', '1 square inch', 'square inches'],
        ['square-foot', '1 square foot', 'square feet']
    ] as const)('projects semantic unit %s into language', (unitId, singular, plural) => {
        expect(getSquareAreaUnit(unitId)).toEqual({singular, plural});
        expect(getAreaTilePrompt(unitId)).toContain(singular);
    });

    it('derives each family story from its mathematical roles', () => {
        expect(getEqualSquareStoryPrompt(equalSquares)).toContain('classroom display');
        expect(getUnitSquareStoryPrompt(unitGrid)).toContain('floor');
        expect(getRectangleAreaStoryPrompt(rectangle, false)).toContain('garden');
        expect(getRectangleAreaStoryPrompt(rectangle, true)).toContain('area formula');
    });
});

describe('rectangle diagram geometry', () => {
    it('uses the same visual scale for both dimensions and stays within bounds', () => {
        const normal = getRectangleDiagramGeometry(2, 3);
        const wide = getRectangleDiagramGeometry(9, 2);
        expect(normal.pixelLength / 2).toBeCloseTo(normal.pixelWidth / 3);
        expect(wide.pixelLength).toBeLessThanOrEqual(292);
        expect(wide.pixelWidth).toBeLessThanOrEqual(170);
    });
});
