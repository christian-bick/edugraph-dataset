import type {
    RectangularPrismCellGroup, RectangularPrismVolumeProblem, UnitCubeCell
} from '../../../types/problems.ts';

const sameCell = (left: Readonly<UnitCubeCell>, right: Readonly<UnitCubeCell>): boolean =>
    left.column === right.column && left.row === right.row && left.layer === right.layer;

const validGroups = (
    groups: readonly RectangularPrismCellGroup[],
    expectedGroups: readonly (readonly Readonly<UnitCubeCell>[])[]
): boolean => {
    if (!Array.isArray(groups) || groups.length !== expectedGroups.length) return false;
    return groups.every((group, index) => {
        const expectedCells = expectedGroups[index];
        return group?.index === index
            && Array.isArray(group.cells)
            && group.cubeCount === expectedCells?.length
            && group.cells.length === expectedCells.length
            && group.cells.every((cell: Readonly<UnitCubeCell>, position: number) =>
                cell && sameCell(cell, expectedCells[position]!));
    });
};

/** Validate every visible factor, cell, partition, and equality before projecting a task. */
export const isValidRectangularPrismVolume = (data: RectangularPrismVolumeProblem): boolean => {
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

export type PrismExpression = {formula: string; substitution: string; answer: string};

export const prismExpression = (data: RectangularPrismVolumeProblem): PrismExpression => {
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
