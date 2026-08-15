import {Ability, Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'area-perimeter-relations',
    generalLabels: [
        Area.PerimeterCalculation,
        Area.AreaCalculation,
        Area.Rectangle,
        Scope.Equal,
        Ability.ConceptDerivation
    ]
};

export const AreaPerimeterRelationsGeneratorSchema = {} as const;

export type AreaPerimeterRelationsGeneratorConfig = ConfigFromSchema<
    typeof AreaPerimeterRelationsGeneratorSchema
>;
