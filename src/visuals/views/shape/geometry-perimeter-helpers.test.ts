import {describe, expect, it} from 'vitest';
import {RectanglePerimeterProblem} from '../../../types/problems.ts';
import {isValidGrade4RectanglePerimeterProblem} from './geometry-perimeter-helpers.ts';

const rectangle: RectanglePerimeterProblem = {
    shape: 'rectangle',
    vertices: [{x: 0, y: 0}, {x: 12, y: 0}, {x: 12, y: 5}, {x: 0, y: 5}],
    sideLengths: [12, 5, 12, 5],
    length: 12,
    width: 5,
    perimeter: 34,
    unit: 'units',
    formula: 'P = length + width + length + width',
    unknownDimension: 'width',
    knownDimension: 'length',
    knownValue: 12,
    missingValue: 5,
    knownSideTotal: 24
};

describe('Grade 4 rectangle-perimeter view validation', () => {
    it('accepts complete maximum-size neutral rectangle evidence', () => {
        expect(isValidGrade4RectanglePerimeterProblem(rectangle)).toBe(true);
    });

    it('rejects mismatched sides, vertices, and inverse evidence', () => {
        expect(isValidGrade4RectanglePerimeterProblem({
            ...rectangle,
            sideLengths: [12, 5, 11, 5]
        })).toBe(false);
        expect(isValidGrade4RectanglePerimeterProblem({
            ...rectangle,
            vertices: [{x: 0, y: 0}]
        })).toBe(false);
        expect(isValidGrade4RectanglePerimeterProblem({
            ...rectangle,
            knownSideTotal: 10
        })).toBe(false);
    });

    it('rejects dimensions outside the renderer capacity', () => {
        expect(isValidGrade4RectanglePerimeterProblem({...rectangle, length: 13})).toBe(false);
    });
});
