import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry',
    supportedLabels: [
        Area.Geometry
    ]
};
