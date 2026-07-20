import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {selectExactMatch} from '../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-classify-dim',
    generalLabels: [
        Area.ShapeRecognition,
        Scope.ShapeProperties,
        Scope.ThreeDimensional,
        Scope.TwoDimensional,
    ]
};


export const GeometryClassifyDimGeneratorSchema = {
    classify: [
        [
            Area.Circle,
            Area.Square,
            Area.Rectangle,
            Area.Triangle,
            Area.Hexagon,
            Area.Cube,
            Area.Cone,
            Area.Cylinder,
            Area.Sphere
        ],
        selectExactMatch
    ],
} as const;

export type GeometryClassifyDimGeneratorConfig = ConfigFromSchema<typeof GeometryClassifyDimGeneratorSchema>;
