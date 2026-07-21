import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-env-shapes',
    generalLabels: [
        Area.ShapeRecognition
    ]
};


export const ShapeEnvShapesGeneratorSchema = {
    classify: [
        [
            Area.Circle,
            Area.Square,
            Area.Rectangle
        ],
        selectExactMatch
    ],
} as const;

export type ShapeEnvShapesGeneratorConfig = ConfigFromSchema<typeof ShapeEnvShapesGeneratorSchema>;
