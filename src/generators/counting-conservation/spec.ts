import { GeneratorSpec } from '../../types/generator-spec.ts';
import { Area, Scope } from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-conservation',
    supportedLabels: [
        Area.Numeration,
        Area.NumericIdentity,
        Scope.PhysicalNumbers,
        Scope.AdditiveCount,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};
