import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-attribute',
    supportedLabels: [
        Area.Measurement,
        Scope.LengthMeasurement,
        Scope.WeightMeasurement,
        Scope.NumericRange
    ]
};
