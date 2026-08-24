import {
    EqualSquarePartitionProblem,
    RectangleAreaProblem,
    SquareAreaUnitId,
    UnitSquareGridProblem
} from '../../../types/problems.ts';

type SquareAreaUnitPresentation = {
    singular: string;
    plural: string;
};

const AREA_UNITS: Record<SquareAreaUnitId, SquareAreaUnitPresentation> = {
    'square-unit': {singular: '1 square unit', plural: 'square units'},
    'square-centimeter': {singular: '1 square centimeter', plural: 'square centimeters'},
    'square-meter': {singular: '1 square meter', plural: 'square meters'},
    'square-inch': {singular: '1 square inch', plural: 'square inches'},
    'square-foot': {singular: '1 square foot', plural: 'square feet'}
};

export const getSquareAreaUnit = (
    unitId: SquareAreaUnitId
): SquareAreaUnitPresentation => AREA_UNITS[unitId];

export const getAreaTilePrompt = (
    unitId: SquareAreaUnitId
): string => `Follow the arrows and count every unit-square tile once, increasing the count by 1 at each tile. Each tile measures ${AREA_UNITS[unitId].singular}. What is the area?`;

export const getEqualSquareStoryPrompt = (
    data: EqualSquarePartitionProblem
): string => `A classroom display has ${data.rows} rows and ${data.columns} columns of equal square spaces. How many square spaces are there?`;

export const getUnitSquareStoryPrompt = (
    data: UnitSquareGridProblem
): string => `A floor is completely covered by ${data.rows} rows and ${data.columns} columns of unit-square tiles. Its area is measured in ${AREA_UNITS[data.unitId].plural}. What is the total area?`;

export const getRectangleAreaStoryPrompt = (
    data: RectangleAreaProblem,
    mentionFormula: boolean
): string => mentionFormula
    ? `A rectangular garden is ${data.length} units long and ${data.width} units wide. Use the area formula to find its area.`
    : `A garden is ${data.length} units long and ${data.width} units wide. What is its area?`;

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

const isDimension = (value: number, allowUnit: boolean): boolean =>
    Number.isSafeInteger(value)
    && value >= (allowUnit ? 1 : 2)
    && value <= 5;

export const isValidEqualSquarePartitionProblem = (
    data: EqualSquarePartitionProblem
): boolean => data.kind === 'equal-square-partition'
    && isDimension(data.rows, false)
    && isDimension(data.columns, false)
    && data.rows !== data.columns
    && data.partCount === data.rows * data.columns;

export const isValidUnitSquareGridProblem = (
    data: UnitSquareGridProblem
): boolean => data.kind === 'unit-square-grid'
    && isDimension(data.rows, true)
    && isDimension(data.columns, true)
    && (data.rows === 1) === (data.columns === 1)
    && data.tileCount === data.rows * data.columns
    && data.unitId in AREA_UNITS;

export const isValidRectangleAreaProblem = (
    data: RectangleAreaProblem
): boolean => data.kind === 'rectangle-area'
    && isDimension(data.length, false)
    && isDimension(data.width, false)
    && data.length !== data.width
    && data.area === data.length * data.width
    && data.unitId in AREA_UNITS;

type DirectRectangleAreaPresentation = {
    task: 'calculate-area';
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

export const buildUnitSquareInversionPresentation = (
    data: UnitSquareGridProblem,
    seed: number
): InverseRectangleAreaPresentation => buildInverseAreaPresentation(
    data.columns,
    data.rows,
    data.tileCount,
    seed
);

export const buildRectangleAreaPresentation = (
    data: RectangleAreaProblem,
    task: 'calculate-area' | 'find-missing-area-dimension',
    seed: number
): RectangleAreaPresentation => {
    if (task === 'calculate-area') {
        return {
            task,
            prompt: `Find the area of a rectangle with length ${data.length} units and width ${data.width} units.`,
            questionEquation: `A = ${data.length} × ${data.width} = ?`,
            solutionEquation: `A = ${data.length} × ${data.width} = ${data.area}`,
            answerStatement: `The area is ${data.area} ${AREA_UNITS[data.unitId].plural}.`,
            explanation: `The area formula is A = length × width. Multiply ${data.length} units by ${data.width} units to get ${data.area} ${AREA_UNITS[data.unitId].plural}.`
        };
    }

    return buildInverseAreaPresentation(data.length, data.width, data.area, seed);
};
