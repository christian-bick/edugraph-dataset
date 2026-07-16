import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'comparison',
    supportedLabels: [
        Area.Numeration,
        Area.NumericComparison,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
