import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasSubConcept} from '../../lib/resolvers.ts';

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

export const GeometryClassifyDimGeneralLabels = [
    Area.ShapeIdentity
];

export const GeometryClassifyDimGeneratorSchema = {
    wants2D: [
        [Scope.TwoDimensional], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.TwoDimensional)
    ],
    wants3D: [
        [Scope.ThreeDimensional], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.ThreeDimensional)
    ]
} as const;

export type GeometryClassifyDimGeneratorConfig = ConfigFromSchema<typeof GeometryClassifyDimGeneratorSchema>;
