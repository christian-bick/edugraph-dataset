import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area, Scope } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic',
    supportedLabels: [
        Area.BaseOperations,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumericZero,
        Scope.NumericSign
    ]
};
