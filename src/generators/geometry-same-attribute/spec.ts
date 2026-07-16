import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-same-attribute',
    supportedLabels: [
        Area.ObjectSorting,
        Scope.ShapeProperties,
    ]
};
