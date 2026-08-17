import {
    FindMissingRectanglePerimeterDimensionProblem,
    GeometryPerimeterProblem,
    RectanglePerimeterFormulaProblem
} from '../../../../types/problems.ts';

export type Grade4RectanglePerimeterProblem =
    | RectanglePerimeterFormulaProblem
    | FindMissingRectanglePerimeterDimensionProblem;

export const isGrade4RectanglePerimeterProblem = (
    data: GeometryPerimeterProblem
): data is Grade4RectanglePerimeterProblem => data.task === 'rectangle-perimeter-formula'
    || data.task === 'find-missing-perimeter-dimension';

const hasExactRectangleGeometry = (data: Grade4RectanglePerimeterProblem): boolean => {
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
    return data.vertices.every((vertex, index) => Number.isFinite(vertex.x)
        && Number.isFinite(vertex.y)
        && vertex.x === expectedVertices[index]!.x
        && vertex.y === expectedVertices[index]!.y);
};

const hasRequiredText = (data: Grade4RectanglePerimeterProblem): boolean => [
    data.prompt,
    data.questionEquation,
    data.solutionEquation,
    data.answerStatement,
    data.explanation
].every(value => typeof value === 'string' && value.length > 0);

export const isValidGrade4RectanglePerimeterProblem = (
    data: Grade4RectanglePerimeterProblem
): boolean => {
    if (!hasExactRectangleGeometry(data) || !hasRequiredText(data)) return false;

    if (data.task === 'rectangle-perimeter-formula') {
        return data.prompt
                === `Find the perimeter of a rectangle with length ${data.length} units and width ${data.width} units.`
            && data.questionEquation
                === `P = ${data.length} + ${data.width} + ${data.length} + ${data.width} = ?`
            && data.solutionEquation
                === `P = ${data.length} + ${data.width} + ${data.length} + ${data.width} = ${data.perimeter}`
            && data.answerStatement === `The perimeter is ${data.perimeter} units.`
            && data.explanation
                === `A rectangle has two lengths and two widths. Add ${data.length} + ${data.width} + ${data.length} + ${data.width} to get ${data.perimeter} units.`;
    }

    const expectedKnownDimension = data.unknownDimension === 'length' ? 'width' : 'length';
    const expectedKnownValue = expectedKnownDimension === 'length' ? data.length : data.width;
    const expectedMissingValue = data.unknownDimension === 'length' ? data.length : data.width;
    const expectedKnownSideTotal = expectedKnownValue * 2;
    const expectedQuestionEquation = data.unknownDimension === 'length'
        ? `P = ? + ${data.width} + ? + ${data.width} = ${data.perimeter}`
        : `P = ${data.length} + ? + ${data.length} + ? = ${data.perimeter}`;

    return (data.unknownDimension === 'length' || data.unknownDimension === 'width')
        && data.knownDimension === expectedKnownDimension
        && data.knownValue === expectedKnownValue
        && data.missingValue === expectedMissingValue
        && data.knownSideTotal === expectedKnownSideTotal
        && data.prompt
            === `A rectangle has a perimeter of ${data.perimeter} units and a ${data.knownDimension} of ${data.knownValue} units. Find its ${data.unknownDimension}.`
        && data.questionEquation === expectedQuestionEquation
        && data.inverseEquation === `(${data.perimeter} - ${data.knownSideTotal}) ÷ 2 = ?`
        && data.solutionEquation
            === `(${data.perimeter} - ${data.knownSideTotal}) ÷ 2 = ${data.missingValue}`
        && data.answerStatement === `The ${data.unknownDimension} is ${data.missingValue} units.`
        && data.explanation
            === `The two known ${data.knownDimension} sides total ${data.knownSideTotal} units. Subtract them from ${data.perimeter}, then divide the remaining length equally between the two ${data.unknownDimension} sides to get ${data.missingValue} units.`;
};
