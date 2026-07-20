import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting',
    supportedLabels: [
        Area.Numeration,
        Area.NumericIdentity,
        Scope.AdditiveCount,
        Area.CollectionSense,
        Area.NumericOrder,
        Scope.NumericRange,
        Scope.NumericZero
    ]
};


export const CountingGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type CountingGeneratorConfig = ConfigFromSchema<typeof CountingGeneratorSchema>;
