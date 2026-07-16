import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-env-shapes',
    supportedLabels: [
        Area.Square,
        Area.Rectangle,
        Area.Circle,
        Area.ShapeRecognition
    ]
};
