import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-teen',
    supportedLabels: [
        Area.BaseOperations,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
