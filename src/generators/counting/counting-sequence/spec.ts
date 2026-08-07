import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {hasLabel} from '../../../lib/resolvers.ts';

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
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller120]),
        resolveRangeFromLabels
    ],
    stepMagnitude: [Scope.StepsOf1, Scope.StepsOf10],
    requireMultipleOf10: [[Scope.MultiplesOf10], hasLabel(Scope.MultiplesOf10)]
} as const;

export type CountingSequenceGeneratorConfig = ConfigFromSchema<typeof CountingSequenceGeneratorSchema>;
