import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement',
    supportedLabels: [
        Area.Measurement,
        Scope.LengthMeasurement,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
