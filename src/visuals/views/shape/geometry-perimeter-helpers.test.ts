import {describe, expect, it} from 'vitest';
import {RectanglePerimeterProblem} from '../../../types/problems.ts';
import {
    isValidGrade4RectanglePerimeterProblem,
    projectRectanglePerimeter,
    projectUnknownSideIndex
} from './geometry-perimeter-helpers.ts';

const rectangle: RectanglePerimeterProblem = {
    shape: 'rectangle',
    length: 12,
    width: 5,
    perimeter: 34
};

describe('Grade 4 rectangle-perimeter view validation', () => {
    it('accepts complete maximum-size neutral rectangle evidence', () => {
        expect(isValidGrade4RectanglePerimeterProblem(rectangle)).toBe(true);
    });

    it('rejects an inconsistent calculated perimeter', () => {
        expect(isValidGrade4RectanglePerimeterProblem({...rectangle, perimeter: 33})).toBe(false);
    });

    it('rejects dimensions outside the renderer capacity', () => {
        expect(isValidGrade4RectanglePerimeterProblem({...rectangle, length: 13})).toBe(false);
    });

    it('derives both inverse directions from the view seed', () => {
        expect(projectRectanglePerimeter(rectangle, 2)).toEqual({
            unknownDimension: 'length',
            knownDimension: 'width',
            knownValue: 5,
            missingValue: 12,
            knownSideTotal: 10
        });
        expect(projectRectanglePerimeter(rectangle, 3)).toEqual({
            unknownDimension: 'width',
            knownDimension: 'length',
            knownValue: 12,
            missingValue: 5,
            knownSideTotal: 24
        });
        expect(projectUnknownSideIndex(5, 7)).toBe(2);
    });
});
