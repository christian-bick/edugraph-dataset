import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area, Scope } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-classify',
    supportedLabels: [
        Area.Numeration,
        Area.ObjectSorting,
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
