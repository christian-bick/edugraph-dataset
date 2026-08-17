import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'integer-rounding',
    generalLabels: [
        Area.IntegerRounding,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const IntegerRoundingGeneratorSchema = {
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ],
    roundingMagnitude: [
        Scope.StepsOf10,
        Scope.StepsOf100,
        Scope.StepsOf1000,
        Scope.StepsOf10000,
        Scope.StepsOf100000
    ]
} as const;

export type IntegerRoundingGeneratorConfig = ConfigFromSchema<
    typeof IntegerRoundingGeneratorSchema
>;
