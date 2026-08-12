import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {arithmeticOperations, resolveExplicitOperation} from '../helpers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-ops-pairs',
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.TwoOperands
    ]
};

export const ArithmeticOpsPairsGeneratorSchema = {
    operation: [arithmeticOperations, resolveExplicitOperation],
    requireNegative: [
        [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        hasLabel(Scope.NumbersWithNegatives)
    ],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    requireMultipleOf10: [
        [Scope.MultiplesOf10],
        hasLabel(Scope.MultiplesOf10)
    ],
    invertProcedure: [
        [Ability.ProcedureInversion],
        hasLabel(Ability.ProcedureInversion)
    ],
    requireEqualAddends: [
        [Area.IteratedOperation],
        (labels: string[]) => labels.includes(Area.Addition) && labels.includes(Area.IteratedOperation)
    ],
    requireEvenResult: [
        [Scope.EvenNumbers],
        hasLabel(Scope.EvenNumbers)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]),
        resolveRangeFromLabels
    ]
} as const;

export type ArithmeticOpsPairsGeneratorConfig = ConfigFromSchema<typeof ArithmeticOpsPairsGeneratorSchema>;
