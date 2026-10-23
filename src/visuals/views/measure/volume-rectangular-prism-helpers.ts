import type {
    IntegerRectangularPrismVolumeProblem, RectangularPrismCellGroup, RectangularPrismVolumeProblem, UnitCubeCell
} from '../../../types/problems.ts';
import {isFractionalRectangularPrismVolumeProblem} from '../../../generators/measurement/fractional-rectangular-prism-helpers.ts';

const sameCell = (left: Readonly<UnitCubeCell>, right: Readonly<UnitCubeCell>): boolean =>
    left.column === right.column && left.row === right.row && left.layer === right.layer;

const validGroups = (
    groups: readonly RectangularPrismCellGroup[],
    expectedGroups: readonly (readonly Readonly<UnitCubeCell>[])[]
): boolean => {
    if (!Array.isArray(groups) || groups.length !== expectedGroups.length) return false;
    for (let index = 0; index < groups.length; index++) {
        if (!Object.hasOwn(groups, index)) return false;
        const group = groups[index], expectedCells = expectedGroups[index]!;
        if (!group || group.index !== index || !Array.isArray(group.cells)
            || group.cubeCount !== expectedCells.length || group.cells.length !== expectedCells.length) return false;
        for (let position = 0; position < group.cells.length; position++) {
            if (!Object.hasOwn(group.cells, position)) return false;
            const cell = group.cells[position];
            if (!cell || !sameCell(cell, expectedCells[position]!)) return false;
        }
    }
    return true;
};

/** The preserved side-1 mathematics, including its complete indexed partitions. */
const validIntegerPrism = (data: IntegerRectangularPrismVolumeProblem): boolean => {
    if (
        data?.kind !== 'rectangular-prism-volume'
        || data.unitId !== 'generic'
        || data.unitCubeEdgeLength !== 1
        || !data.dimensions
        || ![2, 3, 4].includes(data.dimensions.length)
        || ![2, 3].includes(data.dimensions.width)
        || ![2, 3].includes(data.dimensions.height)
        || !Array.isArray(data.occupiedCells)
        || !data.measuredInput
    ) return false;

    const {length, width, height} = data.dimensions;
    const baseArea = length * width;
    const volume = baseArea * height;
    if (
        data.occupiedCells.length !== volume
        || data.baseAreaSquareUnits !== baseArea
        || data.cubeCount !== volume
        || data.volumeCubicUnits !== volume
    ) return false;

    for (let index = 0; index < volume; index++) {
        if (!Object.hasOwn(data.occupiedCells, index)) return false;
        const cell = data.occupiedCells[index];
        if (
            !cell
            || cell.column !== index % length
            || cell.row !== Math.floor(index / length) % width
            || cell.layer !== Math.floor(index / baseArea)
        ) return false;
    }

    const heightGroups = Array.from({length: height}, (_, layer) =>
        data.occupiedCells.filter(cell => cell.layer === layer));
    if (!validGroups(data.heightLayers, heightGroups)) return false;

    const input = data.measuredInput;
    if (input.kind === 'three-edges') {
        if (
            input.lengthUnits !== length
            || input.widthUnits !== width
            || input.heightUnits !== height
        ) return false;
    } else if (input.kind === 'base-area-height') {
        if (
            input.baseAreaSquareUnits !== baseArea
            || input.heightUnits !== height
        ) return false;
    } else return false;

    // These are shared-contract dependencies, independent of the selected learner task.
    if (data.countedPackingEquivalence !== undefined && data.modeledTripleProduct !== undefined) return false;
    if ((data.countedPackingEquivalence !== undefined || data.modeledTripleProduct !== undefined)
        && input.kind !== 'three-edges') return false;
    if (data.associativeRegrouping !== undefined && data.modeledTripleProduct === undefined) return false;

    if (data.associativeRegrouping !== undefined) {
        const regrouping = data.associativeRegrouping;
        const columnGroups = Array.from({length}, (_, column) =>
            data.occupiedCells.filter(cell => cell.column === column));
        if (
            !regrouping
            || regrouping.widthHeightProduct !== width * height
            || !validGroups(regrouping.columnSlices, columnGroups)
        ) return false;
    }
    if (data.countedPackingEquivalence !== undefined) {
        const witness = data.countedPackingEquivalence;
        if (
            !witness
            || witness.cubesPerLayer !== baseArea
            || witness.layerCount !== height
            || witness.countedCubes !== volume
            || witness.unitCubeVolumeCubicUnits !== 1
            || witness.countedVolumeCubicUnits !== volume
        ) return false;
    }
    if (data.modeledTripleProduct !== undefined) {
        const witness = data.modeledTripleProduct;
        if (
            !witness
            || !Array.isArray(witness.factors)
            || witness.factors.length !== 3
            || ![0, 1, 2].every(index => Object.hasOwn(witness.factors, index))
            || witness.factors[0] !== length
            || witness.factors[1] !== width
            || witness.factors[2] !== height
            || witness.cubesPerLayer !== baseArea
            || witness.layerCount !== height
            || witness.product !== volume
        ) return false;
    }
    return true;
};

/** Total integer guard; malformed accessors never escape a view's validation boundary. */
export const isValidIntegerRectangularPrismVolume = (value: unknown): value is IntegerRectangularPrismVolumeProblem => {
    try {
        return typeof value === 'object' && value !== null && !Array.isArray(value)
            && validIntegerPrism(value as IntegerRectangularPrismVolumeProblem);
    } catch { return false; }
};

/** Both mathematical members are accepted by every adopted leaf, without label parsing. */
export const isValidRectangularPrismVolume = (value: unknown): value is RectangularPrismVolumeProblem => {
    try {
        return typeof value === 'object' && value !== null && !Array.isArray(value)
            && ((value as {kind?: unknown}).kind === 'fractional-rectangular-prism-volume'
                ? isFractionalRectangularPrismVolumeProblem(value)
                : isValidIntegerRectangularPrismVolume(value));
    } catch { return false; }
};

export type PrismExpression = {formula: string; substitution: string; answer: string};

export const prismExpression = (data: IntegerRectangularPrismVolumeProblem): PrismExpression => {
    const input = data.measuredInput;
    return input.kind === 'three-edges' ? {
        formula: 'V = length × width × height',
        substitution: `V = ${input.lengthUnits} u × ${input.widthUnits} u × ${input.heightUnits} u`,
        answer: `V = ${data.volumeCubicUnits} u³`
    } : {
        formula: 'V = base area × height',
        substitution: `V = ${input.baseAreaSquareUnits} u² × ${input.heightUnits} u`,
        answer: `V = ${data.volumeCubicUnits} u³`
    };
};
