import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: OrderingGeneratorSpec<> = {
    generatorId: 'ordering',
    supportedLabels: [
        Area.NumerationWithIntegers,
        Scope.Base10,
        Scope.NumericRange,
        Scope.NumericZero
    ],
};
