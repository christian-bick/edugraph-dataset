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


const SupportedShapes = [
    Area.Triangle,
    Area.Square,
    Area.Rectangle,
    Area.Circle,
    Area.Hexagon,
    Area.Cube,
    Area.Sphere,
    Area.Cone,
    Area.Cylinder
] as const;

// TODO: Ontological relations could be beneficial here in the future to automatically deduct 
// shapes based on broader categories (e.g., 2D shapes vs 3D shapes).
export const GeometryIdentityGeneratorSchema = {
    shapes: [
        SupportedShapes,
        matchAllLabels
    ]
} as const;

export type GeometryIdentityGeneratorConfig = ConfigFromSchema<typeof GeometryIdentityGeneratorSchema>;
