import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area, Scope } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problem',
    supportedLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
