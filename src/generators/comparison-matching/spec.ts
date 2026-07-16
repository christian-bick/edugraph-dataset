import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area, Scope } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'comparison-matching',
    supportedLabels: [
        Area.Numeration,
        Area.NumericComparison,
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
