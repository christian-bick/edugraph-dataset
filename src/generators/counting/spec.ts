import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area, Scope } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting',
    supportedLabels: [
        Area.Numeration,
        Area.NumericIdentity,
        Scope.PhysicalNumbers,
        Scope.AdditiveCount,
        Area.CollectionSense,
        Area.NumericOrder,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
