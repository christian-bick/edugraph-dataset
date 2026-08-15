import {Ability, Area, Scope} from 'edugraph-ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-perimeter',
    generalLabels: [Area.PerimeterCalculation, Scope.IntegerNumbers]
};

export const GeometryPerimeterGeneratorSchema = {
    polygonShape: [
        [Area.Triangle, Area.Quadrilateral, Area.Pentagon, Area.Hexagon],
        selectExactMatch
    ],
    taskAbility: [
        [Ability.ProcedureExecution],
        selectExactMatch
    ]
} as const;

export type GeometryPerimeterGeneratorConfig = ConfigFromSchema<
    typeof GeometryPerimeterGeneratorSchema
>;
