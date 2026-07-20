import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../types/schema.ts';
import {hasLabel} from '../../lib/resolvers.ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic',
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10
    ]
};


export const ArithmeticGeneratorSchema = {
    operation: [
        Area.Addition,
        Area.Subtraction,
        Area.Multiplication,
        Area.Division
    ],
    allowNegatives: [
        [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        hasLabel(Scope.NumbersWithNegatives)
    ],
    includeZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type ArithmeticGeneratorConfig = ConfigFromSchema<typeof ArithmeticGeneratorSchema>;
