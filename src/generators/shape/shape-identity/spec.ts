import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {matchAllExactLabels} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-identity',
    generalLabels: [
        Area.ShapeIdentity
    ]
};

export const ShapeIdentityGeneratorSchema = {
    shapes: [
        [
            Area.Triangle,
            Area.Square,
            Area.Rectangle,
            Area.Circle,
            Area.Hexagon,
            Area.Cube,
            Area.Sphere,
            Area.Cone,
            Area.Cylinder
        ],
        matchAllExactLabels
    ]
} as const;

export type ShapeIdentityGeneratorConfig = ConfigFromSchema<typeof ShapeIdentityGeneratorSchema>;
