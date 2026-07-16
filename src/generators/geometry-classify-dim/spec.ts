import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-classify-dim',
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
        Scope.TwoDimensional,
        Scope.ThreeDimensional,
    ]
};
