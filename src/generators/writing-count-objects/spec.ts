import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area, Scope } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'writing-count-objects',
    supportedLabels: [
        Area.Numeration,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
