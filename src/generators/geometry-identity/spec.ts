import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Ability} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-identity',
    supportedLabels: [
        Area.Geometry,
        Ability.VisualRecognition,
        Ability.VisualArticulation
    ]
};
