import type {UnitCubeVolumeProblem} from '../../../types/problems.ts';

export type VolumeUnit = {
    length: string;
    square: string;
    cubic: string;
    name: string;
    definition: string;
};

const UNITS: Record<UnitCubeVolumeProblem['unitId'], VolumeUnit> = {
    generic: {
        length: 'u', square: 'u²', cubic: 'u³', name: 'cubic units',
        definition: 'Let 1 u be the length of one small cube’s edge.'
    },
    cm: {
        length: 'cm', square: 'cm²', cubic: 'cm³', name: 'cubic centimeters',
        definition: 'The edge unit is the centimeter.'
    },
    in: {
        length: 'in', square: 'in²', cubic: 'in³', name: 'cubic inches',
        definition: 'The edge unit is the inch.'
    },
    ft: {
        length: 'ft', square: 'ft²', cubic: 'ft³', name: 'cubic feet',
        definition: 'The edge unit is the foot.'
    }
};

export const volumeUnit = (unitId: UnitCubeVolumeProblem['unitId']): VolumeUnit => UNITS[unitId];

export const isValidUnitCubeVolume = (data: UnitCubeVolumeProblem): boolean => {
    if (
        data?.kind !== 'unit-cube-packing'
        || !Object.prototype.hasOwnProperty.call(UNITS, data.unitId)
        || data.unitCubeEdgeLength !== 1
        || !data.bounds
        || ![2, 3, 4].includes(data.bounds.columns)
        || ![2, 3].includes(data.bounds.rows)
        || ![1, 2].includes(data.bounds.layers)
        || !Array.isArray(data.occupiedCells)
    ) return false;

    const {columns, rows, layers} = data.bounds;
    const expectedCount = columns * rows * layers;
    if (data.cubeCount !== expectedCount || data.occupiedCells.length !== expectedCount) return false;

    for (let index = 0; index < expectedCount; index++) {
        const cell = data.occupiedCells[index];
        if (
            !cell
            || cell.column !== index % columns
            || cell.row !== Math.floor(index / columns) % rows
            || cell.layer !== Math.floor(index / (columns * rows))
        ) return false;
    }
    if (data.countingTrace !== undefined) {
        if (!Array.isArray(data.countingTrace) || data.countingTrace.length !== expectedCount) return false;
        for (let index = 0; index < expectedCount; index++) {
            const step = data.countingTrace[index];
            const cell = data.occupiedCells[index];
            if (
                !step || !step.cell || !cell
                || step.ordinal !== index + 1
                || step.cell.column !== cell.column
                || step.cell.row !== cell.row
                || step.cell.layer !== cell.layer
            ) return false;
        }
    }
    return true;
};

export type Point = {x: number; y: number};
export type PrismFace = {points: readonly Point[]; surface: 'left' | 'right' | 'top'};
export type PrismBounds = {columns: number; rows: number; layers: number};

const UNIT_WIDTH = 30;
const UNIT_DEPTH = 17;
const UNIT_HEIGHT = 34;

export const prismViewport = (bounds: PrismBounds) => ({
    width: 80 + (bounds.columns + bounds.rows) * UNIT_WIDTH,
    height: 40 + (bounds.columns + bounds.rows) * UNIT_DEPTH + bounds.layers * UNIT_HEIGHT
});

export const projectCubeCorner = (
    bounds: PrismBounds,
    column: number,
    row: number,
    layer: number
): Point => ({
    x: 40 + bounds.rows * UNIT_WIDTH + (column - row) * UNIT_WIDTH,
    y: 20 + bounds.layers * UNIT_HEIGHT + (column + row) * UNIT_DEPTH - layer * UNIT_HEIGHT
});

/** Exterior unit faces show the assembled packing without claiming hidden cells are visible. */
export const assembledPrismFaces = (bounds: PrismBounds): PrismFace[] => {
    const {columns, rows, layers} = bounds;
    const p = (column: number, row: number, layer: number) =>
        projectCubeCorner(bounds, column, row, layer);
    const faces: PrismFace[] = [];

    for (let layer = 0; layer < layers; layer++) {
        for (let row = 0; row < rows; row++) {
            faces.push({
                surface: 'right',
                points: [p(columns, row, layer), p(columns, row + 1, layer),
                    p(columns, row + 1, layer + 1), p(columns, row, layer + 1)]
            });
        }
        for (let column = 0; column < columns; column++) {
            faces.push({
                surface: 'left',
                points: [p(column, rows, layer), p(column + 1, rows, layer),
                    p(column + 1, rows, layer + 1), p(column, rows, layer + 1)]
            });
        }
    }
    for (let row = 0; row < rows; row++) {
        for (let column = 0; column < columns; column++) {
            faces.push({
                surface: 'top',
                points: [p(column, row, layers), p(column + 1, row, layers),
                    p(column + 1, row + 1, layers), p(column, row + 1, layers)]
            });
        }
    }
    return faces;
};

export const polygonPoints = (points: readonly Point[]): string =>
    points.map(point => `${point.x},${point.y}`).join(' ');
