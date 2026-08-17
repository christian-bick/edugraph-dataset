import {describe, expect, it} from 'vitest';
import {
    FindMissingRectanglePerimeterDimensionProblem,
    RectanglePerimeterFormulaProblem
} from '../../../../types/problems.ts';
import {isValidGrade4RectanglePerimeterProblem} from './helpers.ts';

const direct: RectanglePerimeterFormulaProblem = {
    task: 'rectangle-perimeter-formula',
    shape: 'rectangle',
    vertices: [{x: 0, y: 0}, {x: 12, y: 0}, {x: 12, y: 5}, {x: 0, y: 5}],
    sideLengths: [12, 5, 12, 5],
    length: 12,
    width: 5,
    perimeter: 34,
    unit: 'units',
    formula: 'P = length + width + length + width',
    prompt: 'Find the perimeter of a rectangle with length 12 units and width 5 units.',
    questionEquation: 'P = 12 + 5 + 12 + 5 = ?',
    solutionEquation: 'P = 12 + 5 + 12 + 5 = 34',
    answerStatement: 'The perimeter is 34 units.',
    explanation: 'A rectangle has two lengths and two widths. Add 12 + 5 + 12 + 5 to get 34 units.'
};

const inverse: FindMissingRectanglePerimeterDimensionProblem = {
    ...direct,
    task: 'find-missing-perimeter-dimension',
    unknownDimension: 'width',
    knownDimension: 'length',
    knownValue: 12,
    missingValue: 5,
    knownSideTotal: 24,
    prompt: 'A rectangle has a perimeter of 34 units and a length of 12 units. Find its width.',
    questionEquation: 'P = 12 + ? + 12 + ? = 34',
    inverseEquation: '(34 - 24) ÷ 2 = ?',
    solutionEquation: '(34 - 24) ÷ 2 = 5',
    answerStatement: 'The width is 5 units.',
    explanation: 'The two known length sides total 24 units. Subtract them from 34, then divide the remaining length equally between the two width sides to get 5 units.'
};

describe('Grade 4 rectangle-perimeter view validation', () => {
    it('accepts maximum-size direct and inverse rectangle evidence', () => {
        expect(isValidGrade4RectanglePerimeterProblem(direct)).toBe(true);
        expect(isValidGrade4RectanglePerimeterProblem(inverse)).toBe(true);
    });

    it('rejects mismatched sides, vertices, and inverse evidence', () => {
        expect(isValidGrade4RectanglePerimeterProblem({...direct, sideLengths: [12, 5, 11, 5]})).toBe(false);
        expect(isValidGrade4RectanglePerimeterProblem({...direct, vertices: [{x: 0, y: 0}]})).toBe(false);
        expect(isValidGrade4RectanglePerimeterProblem({...inverse, knownSideTotal: 10})).toBe(false);
        expect(isValidGrade4RectanglePerimeterProblem({...inverse, inverseEquation: '(34 - 10) ÷ 2 = ?'})).toBe(false);
    });

    it('rejects dimensions outside the renderer capacity', () => {
        expect(isValidGrade4RectanglePerimeterProblem({...direct, length: 13})).toBe(false);
    });
});
