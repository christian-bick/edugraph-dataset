import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-env-shapes',
    generalLabels: [
        Area.ShapeRecognition
    ]
};


export const GeometryEnvShapesGeneratorSchema = {
    classify: [
        [
            Area.Circle,
            Area.Square,
            Area.Rectangle
        ],
        selectExactMatch
    ],
} as const;

export type GeometryEnvShapesGeneratorConfig = ConfigFromSchema<typeof GeometryEnvShapesGeneratorSchema>;
