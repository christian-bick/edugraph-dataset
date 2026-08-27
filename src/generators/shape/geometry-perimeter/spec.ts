import {Area, Scope} from 'edugraph-ts';
import {matchAllExactLabels, selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-perimeter',
    generalLabels: [Area.PerimeterCalculation, Scope.IntegerNumbers]
};

export const GeometryPerimeterGeneratorSchema = {
    polygonShape: [
        [Area.Triangle, Area.Rectangle, Area.Quadrilateral, Area.Pentagon, Area.Hexagon],
        selectExactMatch
    ],
    operationFeatures: [[Area.Addition, Area.Equation], matchAllExactLabels]
} as const;

export type GeometryPerimeterGeneratorConfig = ConfigFromSchema<
    typeof GeometryPerimeterGeneratorSchema
>;
