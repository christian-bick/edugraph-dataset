import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-position',
    supportedLabels: [
        Area.SpatialModelling,
        Scope.Above,
        Scope.Below,
        Scope.Beside,
        Scope.Behind
    ]
};
