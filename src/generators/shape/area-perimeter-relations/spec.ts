import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'area-perimeter-relations',
    generalLabels: [
        Area.PerimeterCalculation,
        Area.AreaCalculation,
        Area.Rectangle,
        Scope.Equal
    ]
};

export const AreaPerimeterRelationsGeneratorSchema = {} as const;

export type AreaPerimeterRelationsGeneratorConfig = ConfigFromSchema<
    typeof AreaPerimeterRelationsGeneratorSchema
>;
