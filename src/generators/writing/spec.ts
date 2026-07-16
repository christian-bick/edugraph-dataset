import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area, Scope } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'writing',
    supportedLabels: [
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
