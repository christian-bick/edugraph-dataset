import {describe, expect, it} from 'vitest';
import {
    RectangleAreaFormulaModel,
    ShapeSquareArrayProblem
} from '../../../types/problems.ts';
import {
    buildRectangleAreaPresentation,
    getAreaTilePrompt,
    getSquareArrayStoryPrompt,
    isValidShapeSquareArrayProblem,
    resolveShapeSquareArrayTask
} from './shape-square-array-helpers.ts';

const models: Record<ShapeSquareArrayProblem['model'], ShapeSquareArrayProblem> = {
    'unit-square': {
        model: 'unit-square',
        rows: 1,
        columns: 1,
        squareCount: 1,
        areaUnit: 'square units'
    },
    'equal-square-array': {
        model: 'equal-square-array',
        rows: 4,
        columns: 5,
        squareCount: 20,
        areaUnit: 'square units'
    },
    'unit-square-coverage': {
        model: 'unit-square-coverage',
        rows: 4,
        columns: 5,
        squareCount: 20,
        areaUnit: 'square centimeters'
    },
    'tiled-area-product': {
        model: 'tiled-area-product',
        rows: 4,
        columns: 5,
        squareCount: 20,
        areaUnit: 'square units'
    },
    'rectangle-area-product': {
        model: 'rectangle-area-product',
        rows: 4,
        columns: 5,
        squareCount: 20,
        areaUnit: 'square units'
    },
    'rectangle-area-formula': {
        model: 'rectangle-area-formula',
        rows: 4,
        columns: 5,
        squareCount: 20,
        length: 5,
        width: 4,
        area: 20,
        areaUnit: 'square units',
        formula: 'A = length × width'
    }
};

describe('shape-square-array Ability projection', () => {
    it.each([
        ['unit-square', 'interpretation', 'interpret-unit'],
        ['equal-square-array', 'partition', 'partition'],
        ['equal-square-array', 'execution', 'count'],
        ['unit-square-coverage', 'interpretation', 'interpret-coverage'],
        ['unit-square-coverage', 'execution', 'count-area'],
        ['tiled-area-product', 'understanding', 'explain-product'],
        ['rectangle-area-product', 'execution', 'calculate-area'],
        ['rectangle-area-formula', 'execution', 'rectangle-area-formula'],
        ['rectangle-area-formula', 'inversion', 'find-missing-area-dimension']
    ] as const)('projects %s + %s to %s', (model, mode, task) => {
        expect(resolveShapeSquareArrayTask(models[model], mode)).toBe(task);
    });

    it('rejects an Ability that the mathematical model cannot expose', () => {
        expect(resolveShapeSquareArrayTask(
            models['unit-square'],
            'inversion'
        )).toBeNull();
    });

    it('creates direct and inverse presentations from the same rectangle model', () => {
        const data = models['rectangle-area-formula'] as RectangleAreaFormulaModel;
        const direct = buildRectangleAreaPresentation(data, 'rectangle-area-formula', 2);
        const inverse = buildRectangleAreaPresentation(data, 'find-missing-area-dimension', 2);

        expect(direct.questionEquation).toBe('A = 5 × 4 = ?');
        expect(direct.solutionEquation).toBe('A = 5 × 4 = 20');
        expect(inverse.task).toBe('find-missing-area-dimension');
        if (inverse.task !== 'find-missing-area-dimension') {
            throw new Error('Expected an inverse presentation.');
        }
        expect(inverse.unknownDimension).toBe('length');
        expect(inverse.questionEquation).toBe('20 = ? × 4');
        expect(inverse.inverseEquation).toBe('20 ÷ 4 = ?');
        expect(inverse.solutionEquation).toBe('20 ÷ 4 = 5');
    });

    it('uses the render seed to vary which dimension is unknown', () => {
        const data = models['rectangle-area-formula'] as RectangleAreaFormulaModel;
        const even = buildRectangleAreaPresentation(data, 'find-missing-area-dimension', 2);
        const odd = buildRectangleAreaPresentation(data, 'find-missing-area-dimension', 3);

        expect(even.task === 'find-missing-area-dimension' && even.unknownDimension).toBe('length');
        expect(odd.task === 'find-missing-area-dimension' && odd.unknownDimension).toBe('width');
    });
});

describe('shape-square-array problem validation', () => {
    it('accepts every complete mathematical model', () => {
        for (const model of Object.values(models)) {
            expect(isValidShapeSquareArrayProblem(model)).toBe(true);
        }
    });

    it('rejects inconsistent products, formula dimensions, and square arrays', () => {
        expect(isValidShapeSquareArrayProblem({
            ...models['unit-square-coverage'],
            squareCount: 19
        } as ShapeSquareArrayProblem)).toBe(false);
        expect(isValidShapeSquareArrayProblem({
            ...models['rectangle-area-formula'],
            area: 19
        } as RectangleAreaFormulaModel)).toBe(false);
        expect(isValidShapeSquareArrayProblem({
            ...models['equal-square-array'],
            rows: 5,
            columns: 5,
            squareCount: 25
        } as ShapeSquareArrayProblem)).toBe(false);
    });
});

describe('area-tile wording', () => {
    it.each([
        ['square units', '1 square unit'],
        ['square centimeters', '1 square centimeter'],
        ['square meters', '1 square meter'],
        ['square inches', '1 square inch'],
        ['square feet', '1 square foot']
    ] as const)('identifies each %s tile as a unit square measuring %s', (areaUnit, measure) => {
        expect(getAreaTilePrompt(areaUnit)).toBe(
            `Count the unit-square tiles, each measuring ${measure}, that cover this figure. What is its area?`
        );
    });
});

describe('shape-square-array story wording', () => {
    it('provides a textual context for every execution payload family', () => {
        expect(getSquareArrayStoryPrompt(models['equal-square-array'], 'count'))
            .toContain('classroom display');
        expect(getSquareArrayStoryPrompt(models['unit-square-coverage'], 'count-area'))
            .toContain('floor');
        expect(getSquareArrayStoryPrompt(models['rectangle-area-product'], 'calculate-area'))
            .toContain('garden');
        expect(getSquareArrayStoryPrompt(models['rectangle-area-formula'], 'rectangle-area-formula'))
            .toContain('area formula');
    });
});
