import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {matchAllExactLabels} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-classify-attributes',
    generalLabels: [Area.ShapeRecognition]
};

export const ShapeClassifyAttributesGeneratorSchema = {
    shapes: [
        [Area.Triangle, Area.Quadrilateral, Area.Pentagon, Area.Hexagon, Area.Cube],
        matchAllExactLabels
    ],
    attributeCounts: [
        [Scope.VertexCount, Scope.FaceCount, Scope.Equal],
        matchAllExactLabels
    ]
} as const;

export type ShapeClassifyAttributesGeneratorConfig = ConfigFromSchema<
    typeof ShapeClassifyAttributesGeneratorSchema
>;
