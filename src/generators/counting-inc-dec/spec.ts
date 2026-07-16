import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-inc-dec',
    supportedLabels: [
        Area.Numeration,
        Scope.AdditiveCount,
        Scope.SubtractiveCount,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
