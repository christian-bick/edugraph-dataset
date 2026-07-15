import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area, Scope } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting',
    supportedLabels: [
        Area.Numeration,
        Scope.PhysicalNumbers,
        Scope.AdditiveCount,
        Area.NumericIdentity,
        Area.ObjectSorting,
        Area.CollectionSense,
        Area.NumericOrder,
        Scope.NumericRange
    ]
};
