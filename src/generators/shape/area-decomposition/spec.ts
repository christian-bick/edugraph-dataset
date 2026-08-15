import {Ability, Area, Scope} from 'edugraph-ts';
import {matchAllExactLabels, selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'area-decomposition',
    generalLabels: [
        Area.AreaCalculation,
        Area.Rectangle,
        Area.ShapeComposition,
        Area.Addition
    ]
};

export const AreaDecompositionGeneratorSchema = {
    decompositionKind: [
        [Area.DistributiveLaw, Ability.VisualDecomposition],
        selectExactMatch
    ],
    distributiveFeatures: [
        [Area.Multiplication, Scope.ThreeOperands],
        matchAllExactLabels
    ]
} as const;

export type AreaDecompositionGeneratorConfig = ConfigFromSchema<
    typeof AreaDecompositionGeneratorSchema
>;
