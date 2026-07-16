import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-classify-sort',
    supportedLabels: [
        Area.Numeration,
        Area.ObjectSorting,
        Area.NumericOrder,
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
