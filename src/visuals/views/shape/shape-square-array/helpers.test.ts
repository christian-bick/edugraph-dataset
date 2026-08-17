import {describe, expect, it} from 'vitest';
import {FindMissingRectangleAreaDimensionProblem, RectangleAreaFormulaProblem} from '../../../../types/problems.ts';
import {getAreaTilePrompt, isValidGrade4RectangleAreaProblem} from './helpers.ts';

const direct: RectangleAreaFormulaProblem = {
    task: 'rectangle-area-formula',
    rows: 4,
    columns: 5,
    squareCount: 20,
    length: 5,
    width: 4,
    area: 20,
    areaUnit: 'square units',
    formula: 'A = length × width',
    prompt: 'Find the area of a rectangle with length 5 units and width 4 units.',
    questionEquation: 'A = 5 × 4 = ?',
    solutionEquation: 'A = 5 × 4 = 20',
    answerStatement: 'The area is 20 square units.',
    explanation: 'The area formula is A = length × width. Multiply 5 units by 4 units to get 20 square units.'
};

const inverse: FindMissingRectangleAreaDimensionProblem = {
    ...direct,
    task: 'find-missing-area-dimension',
    unknownDimension: 'length',
    knownDimension: 'width',
    knownValue: 4,
    missingValue: 5,
    prompt: 'A rectangle has an area of 20 square units and a width of 4 units. Find its length.',
    questionEquation: '20 = ? × 4',
    inverseEquation: '20 ÷ 4 = ?',
    solutionEquation: '20 ÷ 4 = 5',
    answerStatement: 'The length is 5 units.',
    explanation: 'Because area equals length times width, divide 20 by the known width, 4, to get the missing length, 5 units.'
};

describe('Grade 4 rectangle-area view validation', () => {
    it('accepts direct formula execution and inverse dimension evidence', () => {
        expect(isValidGrade4RectangleAreaProblem(direct)).toBe(true);
        expect(isValidGrade4RectangleAreaProblem(inverse)).toBe(true);
    });

    it('rejects inconsistent products, roles, and supplied equations', () => {
        expect(isValidGrade4RectangleAreaProblem({...direct, area: 19})).toBe(false);
        expect(isValidGrade4RectangleAreaProblem({...inverse, knownDimension: 'length'})).toBe(false);
        expect(isValidGrade4RectangleAreaProblem({...inverse, inverseEquation: '20 ÷ 5 = ?'})).toBe(false);
    });

    it('enforces the five-by-five physical capacity and non-square rectangle boundary', () => {
        expect(isValidGrade4RectangleAreaProblem({...direct, rows: 5, width: 5, area: 25, squareCount: 25})).toBe(false);
    });
});

describe('legacy area-tile wording', () => {
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
