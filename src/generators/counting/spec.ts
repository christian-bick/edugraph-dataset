import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting',
    generalLabels: [
        Area.Numeration,
        Area.NumericIdentity,
        Area.CollectionSense,
        Area.NumericOrder,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.AdditiveCount
    ]
};


export const CountingGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller20]),
        resolveRangeFromLabels
    ]
} as const;

export type CountingGeneratorConfig = ConfigFromSchema<typeof CountingGeneratorSchema>;
