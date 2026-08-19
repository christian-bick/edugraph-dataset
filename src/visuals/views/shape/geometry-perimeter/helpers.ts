import {
    GeometryPerimeterProblem,
    RectanglePerimeterProblem
} from '../../../../types/problems.ts';

export type Grade4RectanglePerimeterProblem = RectanglePerimeterProblem;

export const isGrade4RectanglePerimeterProblem = (
    data: GeometryPerimeterProblem
): data is Grade4RectanglePerimeterProblem => data.shape === 'rectangle';

export const isValidGrade4RectanglePerimeterProblem = (
    data: Grade4RectanglePerimeterProblem
): boolean => {
    if (data.shape !== 'rectangle'
        || data.unit !== 'units'
        || data.formula !== 'P = length + width + length + width'
        || !Number.isSafeInteger(data.length)
        || !Number.isSafeInteger(data.width)
        || data.length < 2
        || data.length > 12
        || data.width < 2
        || data.width > 12
        || data.length === data.width
        || !Array.isArray(data.sideLengths)
        || data.sideLengths.length !== 4
        || data.sideLengths[0] !== data.length
        || data.sideLengths[1] !== data.width
        || data.sideLengths[2] !== data.length
        || data.sideLengths[3] !== data.width
        || data.perimeter !== 2 * (data.length + data.width)
        || !Array.isArray(data.vertices)
        || data.vertices.length !== 4) return false;

    const expectedVertices = [
        {x: 0, y: 0},
        {x: data.length, y: 0},
        {x: data.length, y: data.width},
        {x: 0, y: data.width}
    ];
    if (!data.vertices.every((vertex, index) => Number.isFinite(vertex.x)
        && Number.isFinite(vertex.y)
        && vertex.x === expectedVertices[index]!.x
        && vertex.y === expectedVertices[index]!.y)) return false;

    const expectedKnownDimension = data.unknownDimension === 'length' ? 'width' : 'length';
    const expectedKnownValue = expectedKnownDimension === 'length' ? data.length : data.width;
    const expectedMissingValue = data.unknownDimension === 'length' ? data.length : data.width;

    return (data.unknownDimension === 'length' || data.unknownDimension === 'width')
        && data.knownDimension === expectedKnownDimension
        && data.knownValue === expectedKnownValue
        && data.missingValue === expectedMissingValue
        && data.knownSideTotal === expectedKnownValue * 2;
};
