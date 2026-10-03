import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const calculationModels = [
    [[], 'partition-additivity'],
    [[Area.Multiplication, Area.Equation], 'component-products-plus-sum']
] as const;

const resolveCalculationModel = selectExactLabelSetMap(calculationModels);

export const spec: GeneratorSpec = {
    generatorId: 'volume-composite-prisms',
    generalLabels: [
        Area.VolumeCalculation,
        Area.RectangularPrism,
        Area.ShapeDecomposition,
        Area.Addition,
        Scope.IntegerNumbers
    ]
};

export const VolumeCompositePrismsGeneratorSchema = {
    calculationModel: [[Area.Multiplication, Area.Equation],
        resolveCalculationModel, calculationModels.map(([labels]) => labels)]
} as const;

export type VolumeCompositePrismsGeneratorConfig = ConfigFromSchema<
    typeof VolumeCompositePrismsGeneratorSchema
>;
