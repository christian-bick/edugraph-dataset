import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'counting-sequence',
    generalLabels: [
        Area.NumerationWithIntegers,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.After
    ]
};

export const CountingSequenceGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller100]),
        resolveRangeFromLabels
    ],
    countMode: [Scope.AdditiveCount, Scope.MultiplesOf10]
} as const;

export type CountingSequenceGeneratorConfig = ConfigFromSchema<typeof CountingSequenceGeneratorSchema>;
