import {
    GeometryPerimeterProblem,
    RectanglePerimeterProblem
} from '../../../types/problems.ts';

export type Grade4RectanglePerimeterProblem = RectanglePerimeterProblem;

export type RectanglePerimeterProjection = {
    unknownDimension: 'length' | 'width';
    knownDimension: 'length' | 'width';
    knownValue: number;
    missingValue: number;
    knownSideTotal: number;
};

export const isGrade4RectanglePerimeterProblem = (
    data: GeometryPerimeterProblem
): data is Grade4RectanglePerimeterProblem => data.shape === 'rectangle';

export const isValidGrade4RectanglePerimeterProblem = (
    data: Grade4RectanglePerimeterProblem
): boolean => {
    if (data.shape !== 'rectangle'
        || !Number.isSafeInteger(data.length)
        || !Number.isSafeInteger(data.width)
        || data.length < 2
        || data.length > 12
        || data.width < 2
        || data.width > 12
        || data.length === data.width
        || data.perimeter !== 2 * (data.length + data.width)) return false;

    return true;
};

export const projectRectanglePerimeter = (
    data: Grade4RectanglePerimeterProblem,
    seed: number
): RectanglePerimeterProjection => {
    const unknownDimension = Math.abs(Math.trunc(seed)) % 2 === 0 ? 'length' : 'width';
    const knownDimension = unknownDimension === 'length' ? 'width' : 'length';
    const knownValue = knownDimension === 'length' ? data.length : data.width;
    return {
        unknownDimension,
        knownDimension,
        knownValue,
        missingValue: unknownDimension === 'length' ? data.length : data.width,
        knownSideTotal: knownValue * 2
    };
};

export const projectUnknownSideIndex = (sideCount: number, seed: number): number =>
    Math.abs(Math.trunc(seed)) % sideCount;
