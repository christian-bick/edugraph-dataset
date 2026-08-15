import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'area-decomposition',
    generalLabels: [
        Area.AreaCalculation,
        Area.Rectangle,
        Area.ShapeComposition,
        Area.Multiplication,
        Area.Addition,
        Area.DistributiveLaw,
        Scope.ThreeOperands
    ]
};

export const AreaDecompositionGeneratorSchema = {} as const;

export type AreaDecompositionGeneratorConfig = ConfigFromSchema<
    typeof AreaDecompositionGeneratorSchema
>;
