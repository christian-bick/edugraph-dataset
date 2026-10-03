import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {RectangularPrismCellGroup, RectangularPrismVolumeProblem, UnitCubeCell} from '../../../types/problems.ts';
import {VolumeRectangularPrismGeneratorConfig, VolumeRectangularPrismGeneratorSchema} from './spec.ts';

type Dimensions = RectangularPrismVolumeProblem['dimensions'];
type RelationProfile = VolumeRectangularPrismGeneratorConfig['relationProfile'];

const dimensions: readonly Dimensions[] = ([2, 3, 4] as const).flatMap(length =>
    ([2, 3] as const).flatMap(width =>
        ([2, 3] as const)
            .filter(height => length !== width || width !== height)
            .map(height => ({length, width, height}))));

const profiles: readonly RelationProfile[] = [
    'packing-equivalence',
    'triple-product',
    'associative-triple-product',
    'edge-formula',
    'base-area-formula'
];

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

    generate(config: VolumeRectangularPrismGeneratorConfig): ProblemStub<RectangularPrismVolumeProblem> {
        validateConfigFields('volume-rectangular-prism', config, ['relationProfile']);
        if (!profiles.includes(config.relationProfile)) {
            throw new GeneratorValidationError('volume-rectangular-prism', 'Expected a supported prism relation profile.');
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
