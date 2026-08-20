import {
    RectangleAreaFormulaModel,
    ShapeSquareArrayProblem,
    SquareAreaUnit
} from '../../../types/problems.ts';

const AREA_TILE_MEASURES: Record<SquareAreaUnit, string> = {
    'square units': '1 square unit',
    'square centimeters': '1 square centimeter',
    'square meters': '1 square meter',
    'square inches': '1 square inch',
    'square feet': '1 square foot'
};

export const getAreaTilePrompt = (
    areaUnit: SquareAreaUnit
): string => `Follow the arrows and count every unit-square tile once, increasing the count by 1 at each tile. Each tile measures ${AREA_TILE_MEASURES[areaUnit]}. What is the area?`;

export const getRectangleDiagramGeometry = (
    length: number,
    width: number
): {x: number; y: number; pixelLength: number; pixelWidth: number} => {
    const scale = Math.min(292 / length, 170 / width, 64);
    const pixelLength = length * scale;
    const pixelWidth = width * scale;
    return {
        x: (440 - pixelLength) / 2,
        y: 30 + (170 - pixelWidth) / 2,
        pixelLength,
        pixelWidth
    };
};

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

type ShapeSquareArrayStoryTask = Extract<
    ShapeSquareArrayTask,
    'count' | 'count-area' | 'calculate-area' | 'rectangle-area-formula'
>;

export const getSquareArrayStoryPrompt = (
    data: ShapeSquareArrayProblem,
    task: ShapeSquareArrayStoryTask
): string => {
    if (task === 'count') {
        return `A classroom display has ${data.rows} rows and ${data.columns} columns of equal square spaces. How many square spaces are there?`;
    }
    if (task === 'count-area') {
        return `A floor is completely covered by ${data.rows} rows and ${data.columns} columns of unit-square tiles. Its area is measured in ${data.areaUnit}. What is the total area?`;
    }
    if (task === 'calculate-area') {
        return `A garden is ${data.columns} units long and ${data.rows} units wide. What is its area?`;
    }
    return `A rectangular garden is ${data.columns} units long and ${data.rows} units wide. Use the area formula to find its area.`;
};

export type ShapeSquareArrayMode =
    | 'interpretation'
    | 'partition'
    | 'execution'
    | 'inversion'
    | 'understanding';

export const resolveShapeSquareArrayTask = (
    data: ShapeSquareArrayProblem,
    mode: ShapeSquareArrayMode
): ShapeSquareArrayTask | null => {
    if (data.model === 'unit-square' && mode === 'interpretation') {
        return 'interpret-unit';
    }
    if (data.model !== 'unit-square' && mode === 'inversion') {
        return 'find-missing-area-dimension';
    }
    if (data.model === 'equal-square-array') {
        if (mode === 'partition') return 'partition';
        if (mode === 'execution') return 'count';
    }
    if (data.model === 'unit-square-coverage') {
        if (mode === 'interpretation') return 'interpret-coverage';
        if (mode === 'execution') return 'count-area';
    }
    if (
        data.model === 'tiled-area-product'
        && mode === 'understanding'
    ) return 'explain-product';
    if (
        data.model === 'rectangle-area-product'
        && mode === 'execution'
    ) return 'calculate-area';
    if (data.model === 'rectangle-area-formula') {
        if (mode === 'execution') return 'rectangle-area-formula';
        if (mode === 'inversion') return 'find-missing-area-dimension';
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

const buildInverseAreaPresentation = (
    length: number,
    width: number,
    area: number,
    seed: number
): InverseRectangleAreaPresentation => {
    const unknownDimension = Math.abs(seed) % 2 === 0 ? 'length' : 'width';
    const knownDimension = unknownDimension === 'length' ? 'width' : 'length';
    const knownValue = knownDimension === 'length' ? length : width;
    const missingValue = unknownDimension === 'length' ? length : width;
    const questionEquation = unknownDimension === 'length'
        ? `${area} = ? × ${width}`
        : `${area} = ${length} × ?`;

    return {
        task: 'find-missing-area-dimension',
        unknownDimension,
        knownDimension,
        knownValue,
        missingValue,
        prompt: `A rectangle has an area of ${area} square units and a ${knownDimension} of ${knownValue} units. Find its ${unknownDimension}.`,
        questionEquation,
        inverseEquation: `${area} ÷ ${knownValue} = ?`,
        solutionEquation: `${area} ÷ ${knownValue} = ${missingValue}`,
        answerStatement: `The ${unknownDimension} is ${missingValue} units.`,
        explanation: `Because area equals length times width, divide ${area} by the known ${knownDimension}, ${knownValue}, to get the missing ${unknownDimension}, ${missingValue} units.`
    };
};

export const buildSquareArrayInversionPresentation = (
    data: ShapeSquareArrayProblem,
    seed: number
): InverseRectangleAreaPresentation => buildInverseAreaPresentation(
    data.columns,
    data.rows,
    data.squareCount,
    seed
);

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

    return buildInverseAreaPresentation(data.length, data.width, data.area, seed);
};
