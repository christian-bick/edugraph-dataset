import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area, Scope } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'writing',
    supportedLabels: [
        Area.DigitNotation,
        Area.Numeration,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers,
        Scope.NumbersWithZero,
        Scope.NumericRange
    ]
};
