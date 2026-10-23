import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {FractionalRectangularPrismVolumeProblem, IntegerRectangularPrismVolumeProblem, RectangularPrismCellGroup, RectangularPrismVolumeProblem, UnitCubeCell} from '../../../types/problems.ts';
import {buildFractionalRectangularPrismVolumeProblem, type FractionalPrismRelationProfile} from '../fractional-rectangular-prism-helpers.ts';
import {VolumeRectangularPrismGeneratorConfig, VolumeRectangularPrismGeneratorSchema} from './spec.ts';

type Dimensions = IntegerRectangularPrismVolumeProblem['dimensions'];
type RelationProfile = VolumeRectangularPrismGeneratorConfig['relationProfile'];

const dimensions: readonly Dimensions[] = ([2, 3, 4] as const).flatMap(length =>
    ([2, 3] as const).flatMap(width =>
        ([2, 3] as const)
            .filter(height => length !== width || width !== height)
            .map(height => ({length, width, height}))));

const profiles: readonly RelationProfile[] = [
    'packing-count',
    'packing-equivalence',
    'triple-product',
    'associative-triple-product',
    'edge-formula',
    'base-area-formula'
];

const fractionalPackings = ([2, 3, 4] as const).flatMap(partitionDenominator =>
    dimensions.filter(({length, width, height}) => [length, width, height].some(value => value % partitionDenominator !== 0))
        .map(({length, width, height}) => ({partitionDenominator, packingBounds: {columns: length, rows: width, layers: height}})));

/** Counts select actual fractional physical measurements; no profile is copied into the model. */
const sampleFractionalPrism = (relationProfile: FractionalPrismRelationProfile): FractionalRectangularPrismVolumeProblem => {
    const options = fractionalPackings.filter(({packingBounds: {columns, rows, layers}, partitionDenominator: n}) =>
        (relationProfile !== 'associative-triple-product' || columns !== layers)
        && (relationProfile !== 'base-area-formula' || (columns * rows) % (n * n) !== 0 || layers % n !== 0));
    const input = options[Math.floor(random() * options.length)]!;
    return buildFractionalRectangularPrismVolumeProblem({...input, relationProfile});
};

const sampleDimensions = (profile: RelationProfile): Dimensions => {
    const options = profile === 'associative-triple-product'
        ? dimensions.filter(shape => shape.length !== shape.height)
        : dimensions;
    return options[Math.floor(random() * options.length)]!;
};

const buildCells = ({length, width, height}: Dimensions): UnitCubeCell[] => {
    const cells: UnitCubeCell[] = [];
    for (let layer = 0; layer < height; layer++) {
        for (let row = 0; row < width; row++) {
            for (let column = 0; column < length; column++) {
                cells.push({column, row, layer});
            }
        }
    }
    return cells;
};

const groupCells = (
    cells: readonly UnitCubeCell[], count: number, axis: 'layer' | 'column'
): RectangularPrismCellGroup[] =>
    Array.from({length: count}, (_, index) => {
        const members = cells.filter(cell => cell[axis] === index);
        return {index, cells: members, cubeCount: members.length};
    });

export class VolumeRectangularPrismGenerator implements ProblemGenerator<
    RectangularPrismVolumeProblem, VolumeRectangularPrismGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = VolumeRectangularPrismGeneratorSchema;

    generate(config: VolumeRectangularPrismGeneratorConfig & {numberDomain: 'integer'}): ProblemStub<IntegerRectangularPrismVolumeProblem>;
    generate(config: VolumeRectangularPrismGeneratorConfig & {numberDomain: 'fractional'}): ProblemStub<FractionalRectangularPrismVolumeProblem>;
    generate(config: VolumeRectangularPrismGeneratorConfig): ProblemStub<RectangularPrismVolumeProblem>;
    generate(config: VolumeRectangularPrismGeneratorConfig): ProblemStub<RectangularPrismVolumeProblem> {
        validateConfigFields('volume-rectangular-prism', config, ['relationProfile', 'numberDomain']);
        if (!config.relationProfile || !profiles.includes(config.relationProfile)) {
            throw new GeneratorValidationError('volume-rectangular-prism', 'Expected a supported prism relation profile.');
        }
        if (config.numberDomain !== 'integer' && config.numberDomain !== 'fractional') {
            throw new GeneratorValidationError('volume-rectangular-prism', 'Expected an integer or fractional physical measurement domain.');
        }
        if (config.numberDomain === 'fractional') return {data: sampleFractionalPrism(config.relationProfile)};
        if (config.relationProfile === 'packing-count') {
            throw new GeneratorValidationError('volume-rectangular-prism', 'Bare cube counting is supported in the fractional measurement domain.');
        }

        const shape = sampleDimensions(config.relationProfile);
        const {length, width, height} = shape;
        const baseAreaSquareUnits = length * width;
        const volumeCubicUnits = baseAreaSquareUnits * height;
        const occupiedCells = buildCells(shape);
        const heightLayers = groupCells(occupiedCells, height, 'layer');
        const isTripleModel = config.relationProfile === 'triple-product'
            || config.relationProfile === 'associative-triple-product';

        return {data: {
            kind: 'rectangular-prism-volume',
            unitId: 'generic',
            unitCubeEdgeLength: 1,
            dimensions: shape,
            occupiedCells,
            heightLayers,
            baseAreaSquareUnits,
            cubeCount: occupiedCells.length,
            volumeCubicUnits,
            measuredInput: config.relationProfile === 'base-area-formula'
                ? {kind: 'base-area-height', baseAreaSquareUnits, heightUnits: height}
                : {kind: 'three-edges', lengthUnits: length, widthUnits: width, heightUnits: height},
            ...(config.relationProfile === 'packing-equivalence'
                ? {countedPackingEquivalence: {
                    cubesPerLayer: baseAreaSquareUnits,
                    layerCount: height,
                    countedCubes: occupiedCells.length,
                    unitCubeVolumeCubicUnits: 1 as const,
                    countedVolumeCubicUnits: occupiedCells.length
                }}
                : {}),
            ...(isTripleModel
                ? {modeledTripleProduct: {
                    factors: [length, width, height] as const,
                    cubesPerLayer: baseAreaSquareUnits,
                    layerCount: height,
                    product: volumeCubicUnits
                }}
                : {}),
            ...(config.relationProfile === 'associative-triple-product'
                ? {associativeRegrouping: {
                    widthHeightProduct: width * height,
                    columnSlices: groupCells(occupiedCells, length, 'column')
                }}
                : {})
        }};
    }
}
