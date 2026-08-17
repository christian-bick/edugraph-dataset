import {
    FindMissingRectangleAreaDimensionProblem,
    LegacyShapeSquareArrayProblem,
    RectangleAreaFormulaProblem,
    ShapeSquareArrayProblem
} from '../../../../types/problems.ts';

const AREA_TILE_MEASURES: Record<NonNullable<LegacyShapeSquareArrayProblem['areaUnit']>, string> = {
    'square units': '1 square unit',
    'square centimeters': '1 square centimeter',
    'square meters': '1 square meter',
    'square inches': '1 square inch',
    'square feet': '1 square foot'
};

export const getAreaTilePrompt = (
    areaUnit: NonNullable<LegacyShapeSquareArrayProblem['areaUnit']>
): string => `Count the unit-square tiles, each measuring ${AREA_TILE_MEASURES[areaUnit]}, that cover this figure. What is its area?`;

export type Grade4RectangleAreaProblem =
    | RectangleAreaFormulaProblem
    | FindMissingRectangleAreaDimensionProblem;

export const isGrade4RectangleAreaProblem = (
    data: ShapeSquareArrayProblem
): data is Grade4RectangleAreaProblem => data.task === 'rectangle-area-formula'
    || data.task === 'find-missing-area-dimension';

const hasExactCommonAreaEvidence = (data: Grade4RectangleAreaProblem): boolean => {
    if (!Number.isSafeInteger(data.rows)
        || !Number.isSafeInteger(data.columns)
        || data.rows < 2
        || data.rows > 5
        || data.columns < 2
        || data.columns > 5
        || data.rows === data.columns
        || data.length !== data.columns
        || data.width !== data.rows
        || data.squareCount !== data.rows * data.columns
        || data.area !== data.squareCount
        || data.areaUnit !== 'square units'
        || data.formula !== 'A = length × width') return false;
    return typeof data.prompt === 'string'
        && data.prompt.length > 0
        && typeof data.questionEquation === 'string'
        && data.questionEquation.length > 0
        && typeof data.solutionEquation === 'string'
        && data.solutionEquation.length > 0
        && typeof data.answerStatement === 'string'
        && data.answerStatement.length > 0
        && typeof data.explanation === 'string'
        && data.explanation.length > 0;
};

export const isValidGrade4RectangleAreaProblem = (
    data: Grade4RectangleAreaProblem
): boolean => {
    if (!hasExactCommonAreaEvidence(data)) return false;

    if (data.task === 'rectangle-area-formula') {
        return data.prompt
                === `Find the area of a rectangle with length ${data.length} units and width ${data.width} units.`
            && data.questionEquation === `A = ${data.length} × ${data.width} = ?`
            && data.solutionEquation === `A = ${data.length} × ${data.width} = ${data.area}`
            && data.answerStatement === `The area is ${data.area} square units.`
            && data.explanation
                === `The area formula is A = length × width. Multiply ${data.length} units by ${data.width} units to get ${data.area} square units.`;
    }

    const expectedKnownDimension = data.unknownDimension === 'length' ? 'width' : 'length';
    const expectedKnownValue = expectedKnownDimension === 'length' ? data.length : data.width;
    const expectedMissingValue = data.unknownDimension === 'length' ? data.length : data.width;
    const expectedQuestionEquation = data.unknownDimension === 'length'
        ? `${data.area} = ? × ${data.width}`
        : `${data.area} = ${data.length} × ?`;

    return (data.unknownDimension === 'length' || data.unknownDimension === 'width')
        && data.knownDimension === expectedKnownDimension
        && data.knownValue === expectedKnownValue
        && data.missingValue === expectedMissingValue
        && data.prompt
            === `A rectangle has an area of ${data.area} square units and a ${data.knownDimension} of ${data.knownValue} units. Find its ${data.unknownDimension}.`
        && data.questionEquation === expectedQuestionEquation
        && data.inverseEquation === `${data.area} ÷ ${data.knownValue} = ?`
        && data.solutionEquation === `${data.area} ÷ ${data.knownValue} = ${data.missingValue}`
        && data.answerStatement === `The ${data.unknownDimension} is ${data.missingValue} units.`
        && data.explanation
            === `Because area equals length times width, divide ${data.area} by the known ${data.knownDimension}, ${data.knownValue}, to get the missing ${data.unknownDimension}, ${data.missingValue} units.`;
};
