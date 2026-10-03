import type {FractionRectangleAreaProblem, FractionRectangleAreaRational} from '../../../types/problems.ts';

const record = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const positiveInteger = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const nonnegativeInteger = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;

const rational = (value: unknown): value is FractionRectangleAreaRational =>
    record(value) && positiveInteger(value.numerator) && positiveInteger(value.denominator);

const equalRationals = (left: FractionRectangleAreaRational, right: FractionRectangleAreaRational): boolean =>
    BigInt(left.numerator) * BigInt(right.denominator) ===
    BigInt(right.numerator) * BigInt(left.denominator);

const equalProduct = (left: FractionRectangleAreaRational, right: FractionRectangleAreaRational,
    result: FractionRectangleAreaRational): boolean =>
    BigInt(left.numerator) * BigInt(right.numerator) * BigInt(result.denominator) ===
    BigInt(result.numerator) * BigInt(left.denominator) * BigInt(right.denominator);

const gcd = (left: number, right: number): number => {
    let a = left;
    let b = right;
    while (b !== 0) {
        [a, b] = [b, a % b];
    }
    return a;
};

export const formatRectangleRational = ({numerator, denominator}: FractionRectangleAreaRational): string =>
    denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;

/** Check the producer's exact grid, covering cells, and optional equality proof. */
export function isValidFractionRectangleArea(value: unknown): value is FractionRectangleAreaProblem {
    if (!record(value) || value.kind !== 'fraction-rectangle-area' ||
        value.linearUnit !== 'unit' || value.squareUnit !== 'square-unit' ||
        !record(value.outerRectangle) || !record(value.tileGrid) ||
        !rational(value.outerRectangle.length) || !rational(value.outerRectangle.width) ||
        !rational(value.areaSquareUnits)) return false;

    const {length, width} = value.outerRectangle;
    const area = value.areaSquareUnits;
    const grid = value.tileGrid;
    if (length.numerator % length.denominator === 0 ||
        width.numerator % width.denominator === 0 ||
        equalRationals(length, width) ||
        !positiveInteger(grid.partitionDenominator) ||
        !record(grid.squareTile) ||
        !rational(grid.squareTile.side) || !rational(grid.squareTile.areaSquareUnits) ||
        !positiveInteger(grid.rows) || !positiveInteger(grid.columns) ||
        !positiveInteger(grid.tileCount) || grid.tileCount > 100 ||
        !Array.isArray(grid.cells) || !rational(grid.tiledAreaSquareUnits)) return false;

    const l = BigInt(grid.partitionDenominator);
    const lengthDenominator = BigInt(length.denominator);
    const widthDenominator = BigInt(width.denominator);
    const expectedLcm = (lengthDenominator / BigInt(gcd(length.denominator, width.denominator))) * widthDenominator;
    if (l !== expectedLcm ||
        BigInt(grid.columns) * lengthDenominator !== BigInt(length.numerator) * l ||
        BigInt(grid.rows) * widthDenominator !== BigInt(width.numerator) * l ||
        BigInt(grid.rows) * BigInt(grid.columns) !== BigInt(grid.tileCount) ||
        grid.squareTile.side.numerator !== 1 ||
        BigInt(grid.squareTile.side.denominator) !== l ||
        grid.squareTile.areaSquareUnits.numerator !== 1 ||
        BigInt(grid.squareTile.areaSquareUnits.denominator) !== l * l ||
        !equalProduct(length, width, area) ||
        !equalProduct({numerator: grid.tileCount, denominator: 1}, grid.squareTile.areaSquareUnits,
            grid.tiledAreaSquareUnits) ||
        !equalRationals(grid.tiledAreaSquareUnits, area) ||
        grid.cells.length !== grid.tileCount) return false;

    for (let index = 0; index < grid.cells.length; index++) {
        const cell: unknown = grid.cells[index];
        if (!record(cell) || !nonnegativeInteger(cell.row) || !nonnegativeInteger(cell.column) ||
            cell.row !== Math.floor(index / grid.columns) || cell.column !== index % grid.columns) return false;
    }

    if (value.tileProof !== undefined) {
        const proof = value.tileProof;
        if (!record(proof) || proof.tileCount !== grid.tileCount ||
            !rational(proof.tileAreaSquareUnits) ||
            !rational(proof.oneRowAreaSquareUnits) ||
            !rational(proof.countedAreaSquareUnits) ||
            !rational(proof.sideProductAreaSquareUnits) ||
            proof.tileAreaSquareUnits.numerator !== grid.squareTile.areaSquareUnits.numerator ||
            proof.tileAreaSquareUnits.denominator !== grid.squareTile.areaSquareUnits.denominator ||
            !equalProduct({numerator: grid.columns, denominator: 1},
                grid.squareTile.areaSquareUnits, proof.oneRowAreaSquareUnits) ||
            !equalProduct({numerator: grid.rows, denominator: 1},
                proof.oneRowAreaSquareUnits, proof.countedAreaSquareUnits) ||
            !equalRationals(proof.countedAreaSquareUnits, grid.tiledAreaSquareUnits) ||
            !equalRationals(proof.sideProductAreaSquareUnits, area)) return false;
    }
    return true;
}

export interface RectangleGridGeometry {
    tilePixels: number;
    gridRows: number;
    gridColumns: number;
    plotX: number;
    plotY: number;
    viewWidth: number;
    viewHeight: number;
}

/** One pixel scale applies to both directions, so a unit-fraction tile remains square. */
export function rectangleGridGeometry(data: FractionRectangleAreaProblem,
    blankConstruction: boolean): RectangleGridGeometry {
    const {rows, columns, partitionDenominator} = data.tileGrid;
    const margin = Math.min(partitionDenominator, 4);
    const gridRows = blankConstruction ? rows + margin : rows;
    const gridColumns = blankConstruction ? columns + margin : columns;
    const tilePixels = Math.min(blankConstruction ? 29 : 34,
        320 / Math.max(gridRows, gridColumns));
    const plotX = 70;
    const plotY = 28;
    return {
        tilePixels, gridRows, gridColumns, plotX, plotY,
        viewWidth: plotX + gridColumns * tilePixels + 38,
        viewHeight: plotY + gridRows * tilePixels + 82
    };
}
