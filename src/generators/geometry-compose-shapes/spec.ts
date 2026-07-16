import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Ability, Area} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-compose-shapes',
    supportedLabels: [
        Area.Rectangle,
        Area.Square,
    ]
};
