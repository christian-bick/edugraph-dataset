import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Ability} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-identity',
    supportedLabels: [
        Area.Circle,
        Area.Square,
        Area.Rectangle,
        Area.Triangle,
        Area.Hexagon,
        Area.Cube,
        Area.Cone,
        Area.Cylinder,
        Area.Sphere,
        Area.ShapeIdentity,
        Ability.VisualRecognition,
        Ability.VisualArticulation
    ]
};
