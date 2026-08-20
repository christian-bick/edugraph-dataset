import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {hasLabel, matchAllExactLabels} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-identity',
    generalLabels: []
};

export const ShapeIdentityGeneratorSchema = {
    shapes: [
        [
            Area.Triangle,
            Area.Rhombus,
            Area.Square,
            Area.Rectangle,
            Area.Quadrilateral,
            Area.Pentagon,
            Area.Circle,
            Area.Hexagon,
            Area.Cube,
            Area.Sphere,
            Area.Cone,
            Area.Cylinder
        ],
        matchAllExactLabels
    ],
    includeAttributes: [[Scope.ShapeAttributes], hasLabel(Scope.ShapeAttributes)]
} as const;

export type ShapeIdentityGeneratorConfig = ConfigFromSchema<typeof ShapeIdentityGeneratorSchema>;
