import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {matchAllLabels} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-identity',
    generalLabels: [
        Area.ShapeIdentity,
        Ability.VisualRecognition,
        Ability.VisualArticulation
    ]
};

export const GeometryIdentityGeneratorSchema = {
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
        matchAllLabels
    ]
} as const;

export type GeometryIdentityGeneratorConfig = ConfigFromSchema<typeof GeometryIdentityGeneratorSchema>;
