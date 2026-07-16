import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area, Scope } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-attribute',
    supportedLabels: [
        Area.Measurement,
        Scope.ArabicNumerals,
        Scope.NumericRange
    ]
};
