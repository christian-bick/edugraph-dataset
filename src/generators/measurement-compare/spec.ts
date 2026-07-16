import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-compare',
    supportedLabels: [
        Area.Measurement,
        Area.ObjectSorting,
        Scope.LengthMeasurement,
        Scope.WeightMeasurement,
        Scope.NumericRange,
        Scope.Greater,
        Scope.Less
    ]
};
