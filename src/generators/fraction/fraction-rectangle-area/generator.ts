import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {
    FractionRectangleAreaProblem,
    FractionRectangleAreaRational,
    FractionRectangleTileCell
} from '../../../types/problems.ts';
import {
    FractionRectangleAreaGeneratorSchema
} from './spec.ts';
import type {FractionRectangleAreaGeneratorConfig} from './spec.ts';

type AreaJustification = NonNullable<FractionRectangleAreaGeneratorConfig['areaJustification']>;
type Candidate = Readonly<{
    length: FractionRectangleAreaRational;
    width: FractionRectangleAreaRational;
    partitionDenominator: number;
    rows: number;
    columns: number;
}>;

const DENOMINATORS = [2, 3, 4, 5, 6] as const;

const greatestCommonDivisor = (a: number, b: number): number => {
    while (b !== 0) [a, b] = [b, a % b];
    return a;
};

const leastCommonMultiple = (a: number, b: number): number =>
    a / greatestCommonDivisor(a, b) * b;

const rational = (numerator: number, denominator: number): FractionRectangleAreaRational =>
    ({numerator, denominator});

const sides: readonly FractionRectangleAreaRational[] = DENOMINATORS.flatMap(denominator =>
    Array.from({length: 2 * denominator - 1}, (_, index) => index + 1)
        .filter(numerator => numerator % denominator !== 0)
        .map(numerator => rational(numerator, denominator))
);

/** A finite exact domain keeps square-cell diagrams legible across both profiles. */
const candidates: readonly Candidate[] = sides.flatMap(length => sides.flatMap(width => {
    if (length.numerator * width.denominator
        === width.numerator * length.denominator) return [];
    const partitionDenominator = leastCommonMultiple(length.denominator, width.denominator);
    const columns = length.numerator * (partitionDenominator / length.denominator);
    const rows = width.numerator * (partitionDenominator / width.denominator);
    if (partitionDenominator > 12 || columns > 10 || rows > 10
        || columns * rows > 64) return [];
    return [{length, width, partitionDenominator, rows, columns}];
}));

const cells = (rows: number, columns: number): FractionRectangleTileCell[] =>
    Array.from({length: rows}, (_, row) =>
        Array.from({length: columns}, (_, column) => ({row, column}))).flat();

function rectangleArea(
    areaJustification: AreaJustification
): FractionRectangleAreaProblem {
    const {length, width, partitionDenominator: L, rows, columns} =
        candidates[Math.floor(random() * candidates.length)]!;
    const tileCount = rows * columns;
    const tileAreaSquareUnits = rational(1, L * L);
    const sideProductAreaSquareUnits = rational(
        length.numerator * width.numerator,
        length.denominator * width.denominator
    );
    const countedAreaSquareUnits = rational(tileCount, L * L);

    return {
        kind: 'fraction-rectangle-area',
        linearUnit: 'unit',
        squareUnit: 'square-unit',
        outerRectangle: {length, width},
        areaSquareUnits: sideProductAreaSquareUnits,
        tileGrid: {
            partitionDenominator: L,
            squareTile: {
                side: rational(1, L),
                areaSquareUnits: tileAreaSquareUnits
            },
            rows,
            columns,
            tileCount,
            cells: cells(rows, columns),
            tiledAreaSquareUnits: countedAreaSquareUnits
        },
        ...(areaJustification === 'square-tile-proof' ? {tileProof: {
            tileCount,
            tileAreaSquareUnits,
            oneRowAreaSquareUnits: rational(columns, L * L),
            countedAreaSquareUnits,
            sideProductAreaSquareUnits
        }} : {})
    };
}

export class FractionRectangleAreaGenerator implements ProblemGenerator<
    FractionRectangleAreaProblem,
    FractionRectangleAreaGeneratorConfig
> {
    type: AbstractProblem['type'] = 'fraction';
    schema = FractionRectangleAreaGeneratorSchema;

    generate(config: FractionRectangleAreaGeneratorConfig): ProblemStub<FractionRectangleAreaProblem> {
        validateConfigFields('fraction-rectangle-area', config, ['areaJustification']);
        switch (config.areaJustification) {
            case 'fraction-side-product':
            case 'square-tile-proof':
                return {data: rectangleArea(config.areaJustification)};
            default:
                throw new GeneratorValidationError('fraction-rectangle-area',
                    'Unsupported area justification.');
        }
    }
}
