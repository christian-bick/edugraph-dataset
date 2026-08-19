import {Ability} from 'edugraph-ts';
import {
    RectangleAreaFormulaModel,
    ShapeSquareArrayProblem,
    SquareAreaUnit
} from '../../../../types/problems.ts';

const AREA_TILE_MEASURES: Record<SquareAreaUnit, string> = {
    'square units': '1 square unit',
    'square centimeters': '1 square centimeter',
    'square meters': '1 square meter',
    'square inches': '1 square inch',
    'square feet': '1 square foot'
};

export const getAreaTilePrompt = (
    areaUnit: SquareAreaUnit
): string => `Count the unit-square tiles, each measuring ${AREA_TILE_MEASURES[areaUnit]}, that cover this figure. What is its area?`;

export type ShapeSquareArrayTask =
    | 'interpret-unit'
    | 'interpret-coverage'
    | 'partition'
    | 'count'
    | 'count-area'
    | 'explain-product'
    | 'calculate-area'
    | 'rectangle-area-formula'
    | 'find-missing-area-dimension';

export const resolveShapeSquareArrayTask = (
    data: ShapeSquareArrayProblem,
    ability: string | undefined
): ShapeSquareArrayTask | null => {
    if (data.model === 'unit-square' && ability === Ability.Interpretation) {
        return 'interpret-unit';
    }
    if (data.model === 'equal-square-array') {
        if (ability === Ability.VisualArticulation) return 'partition';
        if (ability === Ability.ProcedureExecution) return 'count';
    }
    if (data.model === 'unit-square-coverage') {
        if (ability === Ability.Interpretation) return 'interpret-coverage';
        if (ability === Ability.ProcedureExecution) return 'count-area';
    }
    if (
        data.model === 'tiled-area-product'
        && ability === Ability.ProcedureUnderstanding
    ) return 'explain-product';
    if (
        data.model === 'rectangle-area-product'
        && ability === Ability.ProcedureExecution
    ) return 'calculate-area';
    if (data.model === 'rectangle-area-formula') {
        if (ability === Ability.ProcedureExecution) return 'rectangle-area-formula';
        if (ability === Ability.ProcedureInversion) return 'find-missing-area-dimension';
    }
    return null;
};

export const isRectangleAreaFormulaModel = (
    data: ShapeSquareArrayProblem
): data is RectangleAreaFormulaModel => data.model === 'rectangle-area-formula';

const isValidAreaUnit = (value: string): value is SquareAreaUnit => value in AREA_TILE_MEASURES;

export const isValidShapeSquareArrayProblem = (
    data: ShapeSquareArrayProblem
): boolean => {
    if (data.model === 'unit-square') {
        return data.rows === 1
            && data.columns === 1
            && data.squareCount === 1
            && data.areaUnit === 'square units';
    }

    if (!Number.isSafeInteger(data.rows)
        || !Number.isSafeInteger(data.columns)
        || data.rows < 2
        || data.rows > 5
        || data.columns < 2
        || data.columns > 5
        || data.rows === data.columns
        || data.squareCount !== data.rows * data.columns
        || !isValidAreaUnit(data.areaUnit)) return false;

    if (data.model !== 'rectangle-area-formula') return true;

    return data.length === data.columns
        && data.width === data.rows
        && data.area === data.squareCount
        && data.areaUnit === 'square units'
        && data.formula === 'A = length × width';
};

type DirectRectangleAreaPresentation = {
    task: 'rectangle-area-formula';
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    answerStatement: string;
    explanation: string;
};

export type InverseRectangleAreaPresentation = {
    task: 'find-missing-area-dimension';
    unknownDimension: 'length' | 'width';
    knownDimension: 'length' | 'width';
    knownValue: number;
    missingValue: number;
    prompt: string;
    questionEquation: string;
    inverseEquation: string;
    solutionEquation: string;
    answerStatement: string;
    explanation: string;
};

export type RectangleAreaPresentation =
    | DirectRectangleAreaPresentation
    | InverseRectangleAreaPresentation;

export const buildRectangleAreaPresentation = (
    data: RectangleAreaFormulaModel,
    task: 'rectangle-area-formula' | 'find-missing-area-dimension',
    seed: number
): RectangleAreaPresentation => {
    if (task === 'rectangle-area-formula') {
        return {
            task,
            prompt: `Find the area of a rectangle with length ${data.length} units and width ${data.width} units.`,
            questionEquation: `A = ${data.length} × ${data.width} = ?`,
            solutionEquation: `A = ${data.length} × ${data.width} = ${data.area}`,
            answerStatement: `The area is ${data.area} square units.`,
            explanation: `The area formula is A = length × width. Multiply ${data.length} units by ${data.width} units to get ${data.area} square units.`
        };
    }

    const unknownDimension = seed % 2 === 0 ? 'length' : 'width';
    const knownDimension = unknownDimension === 'length' ? 'width' : 'length';
    const knownValue = knownDimension === 'length' ? data.length : data.width;
    const missingValue = unknownDimension === 'length' ? data.length : data.width;
    const questionEquation = unknownDimension === 'length'
        ? `${data.area} = ? × ${data.width}`
        : `${data.area} = ${data.length} × ?`;

    return {
        task,
        unknownDimension,
        knownDimension,
        knownValue,
        missingValue,
        prompt: `A rectangle has an area of ${data.area} square units and a ${knownDimension} of ${knownValue} units. Find its ${unknownDimension}.`,
        questionEquation,
        inverseEquation: `${data.area} ÷ ${knownValue} = ?`,
        solutionEquation: `${data.area} ÷ ${knownValue} = ${missingValue}`,
        answerStatement: `The ${unknownDimension} is ${missingValue} units.`,
        explanation: `Because area equals length times width, divide ${data.area} by the known ${knownDimension}, ${knownValue}, to get the missing ${unknownDimension}, ${missingValue} units.`
    };
};
