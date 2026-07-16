import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-classify-count',
    supportedLabels: [
        Area.Numeration,
        Area.ObjectSorting,
        Area.CollectionSense,
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
