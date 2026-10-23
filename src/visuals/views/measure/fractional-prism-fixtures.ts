import type {AlgebraicScalar, ExactCoefficientArithmetic, FractionalRectangularPrismVolumeProblem, IntegerRectangularPrismVolumeProblem} from '../../../types/problems.ts';

const scalar = (numerator: number, denominator = 1): AlgebraicScalar => ({numerator, denominator});
const mul = (first: AlgebraicScalar, second: AlgebraicScalar, result: AlgebraicScalar): ExactCoefficientArithmetic =>
    ({kind: 'binary', operation: 'multiplication', operands: [first, second], result});
const one = scalar(1), two = scalar(2), three = scalar(3), six = scalar(6);
const half = scalar(1, 2), quarter = scalar(1, 4), eighth = scalar(1, 8);
const threeHalves = scalar(3, 2), threeQuarters = scalar(3, 4);
const cells = [
    {column: 0, row: 0, layer: 0}, {column: 1, row: 0, layer: 0}, {column: 2, row: 0, layer: 0},
    {column: 0, row: 1, layer: 0}, {column: 1, row: 1, layer: 0}, {column: 2, row: 1, layer: 0}
] as const;

/** Independent literal: six half-edge cubes fill a 3/2 × 1 × 1/2 prism. */
export const fractionalPrismLiteral: FractionalRectangularPrismVolumeProblem = {
    kind: 'fractional-rectangular-prism-volume', unitId: 'generic', partitionDenominator: 2,
    unitCubeEdgeLength: half, unitCubeFaceAreaSquareUnits: quarter, unitCubeVolumeCubicUnits: eighth,
    unitCubeProducts: {faceArea: mul(half, half, quarter), volume: mul(quarter, half, eighth)},
    packingBounds: {columns: 3, rows: 2, layers: 1}, occupiedCells: cells,
    countingTrace: cells.map((cell, index) => ({cell, ordinal: index + 1})),
    heightLayers: [{index: 0, cells, cubeCount: 6}], cubesPerLayer: 6, cubeCount: 6,
    countProducts: {layerCount: mul(three, two, six), totalCount: mul(six, one, six)},
    dimensions: {length: threeHalves, width: one, height: half}, baseAreaSquareUnits: threeHalves,
    volumeCubicUnits: threeQuarters,
    physicalProducts: {baseArea: mul(threeHalves, one, threeHalves), volume: mul(threeHalves, half, threeQuarters)},
    packingVolumeProduct: mul(six, eighth, threeQuarters),
    measuredInput: {kind: 'three-edges', lengthUnits: threeHalves, widthUnits: one, heightUnits: half},
    countedPackingEquivalence: {
        edgeScaleProducts: [mul(three, half, threeHalves), mul(two, half, one), mul(one, half, half)],
        layerVolumeCubicUnits: threeQuarters, countedLayerVolumeProduct: mul(six, eighth, threeQuarters),
        measuredLayerVolumeProduct: mul(threeHalves, half, threeQuarters), completeLayerVolumeProduct: mul(one, threeQuarters, threeQuarters)
    }
};

const integerCells = [
    {column: 0, row: 0, layer: 0}, {column: 1, row: 0, layer: 0},
    {column: 0, row: 1, layer: 0}, {column: 1, row: 1, layer: 0},
    {column: 0, row: 0, layer: 1}, {column: 1, row: 0, layer: 1},
    {column: 0, row: 1, layer: 1}, {column: 1, row: 1, layer: 1}
] as const;
export const integerPrismLiteral: IntegerRectangularPrismVolumeProblem = {
    kind: 'rectangular-prism-volume', unitId: 'generic', unitCubeEdgeLength: 1,
    dimensions: {length: 2, width: 2, height: 2}, occupiedCells: integerCells,
    heightLayers: [
        {index: 0, cells: integerCells.slice(0, 4), cubeCount: 4},
        {index: 1, cells: integerCells.slice(4), cubeCount: 4}
    ], baseAreaSquareUnits: 4, cubeCount: 8, volumeCubicUnits: 8,
    measuredInput: {kind: 'three-edges', lengthUnits: 2, widthUnits: 2, heightUnits: 2}
};
