import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {CompositePrismVolumeProblem} from '../../../types/problems.ts';
import {VolumeCompositePrismsGeneratorConfig, VolumeCompositePrismsGeneratorSchema} from './spec.ts';

type Shape = Readonly<{
    leftLength: 2 | 3 | 4;
    rightLength: 2 | 3 | 4;
    depth: 2 | 3;
    leftHeight: 2 | 3;
    rightHeight: 2 | 3;
}>;

const shapes: readonly Shape[] = ([2, 3, 4] as const).flatMap(leftLength =>
    ([2, 3, 4] as const).flatMap(rightLength =>
        ([2, 3] as const).flatMap(depth =>
            ([2, 3] as const).flatMap(leftHeight =>
                ([2, 3] as const).filter(rightHeight => rightHeight !== leftHeight)
                    .map(rightHeight => ({leftLength, rightLength, depth, leftHeight, rightHeight}))))));

export class VolumeCompositePrismsGenerator implements ProblemGenerator<
    CompositePrismVolumeProblem, VolumeCompositePrismsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'measurement';
    schema = VolumeCompositePrismsGeneratorSchema;

    generate(config: VolumeCompositePrismsGeneratorConfig): ProblemStub<CompositePrismVolumeProblem> {
        validateConfigFields('volume-composite-prisms', config, ['calculationModel']);
        if (config.calculationModel !== 'partition-additivity'
            && config.calculationModel !== 'component-products-plus-sum') {
            throw new GeneratorValidationError('volume-composite-prisms', 'Expected a supported composite calculation model.');
        }

        const shape = shapes[Math.floor(random() * shapes.length)]!;
        const {leftLength, rightLength, depth, leftHeight, rightHeight} = shape;
        const leftVolume = leftLength * depth * leftHeight;
        const rightVolume = rightLength * depth * rightHeight;
        const totalVolume = leftVolume + rightVolume;
        const addendsCubicUnits = [leftVolume, rightVolume] as const;

        return {data: {
            kind: 'composite-prism-volume',
            unitId: 'generic',
            parts: [
                {id: 'left', origin: {column: 0, row: 0, layer: 0},
                    dimensions: {length: leftLength, depth, height: leftHeight},
                    volumeCubicUnits: leftVolume},
                {id: 'right', origin: {column: leftLength, row: 0, layer: 0},
                    dimensions: {length: rightLength, depth, height: rightHeight},
                    volumeCubicUnits: rightVolume}
            ],
            sharedFace: {
                planeColumn: leftLength,
                rowSpan: [0, depth],
                layerSpan: [0, Math.min(leftHeight, rightHeight)],
                areaSquareUnits: depth * Math.min(leftHeight, rightHeight),
                volumeCubicUnits: 0
            },
            volumeSum: {addendsCubicUnits, totalCubicUnits: totalVolume},
            ...(config.calculationModel === 'component-products-plus-sum'
                ? {calculationEvidence: {
                    partProducts: [
                        {partId: 'left', factors: [leftLength, depth, leftHeight],
                            productCubicUnits: leftVolume},
                        {partId: 'right', factors: [rightLength, depth, rightHeight],
                            productCubicUnits: rightVolume}
                    ],
                    sumEquation: {addendsCubicUnits, resultCubicUnits: totalVolume}
                }}
                : {})
        }};
    }
}
