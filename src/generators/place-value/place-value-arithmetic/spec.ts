import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {hasLabel, selectCanonicalLabel} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const resolveOperation = selectCanonicalLabel([
    [[Area.AdditionPlaceValuePartitioning, Area.Addition], Area.Addition],
    [[Area.SubtractionPlaceValuePartitioning, Area.Subtraction], Area.Subtraction]
] as const);

export const spec: GeneratorSpec = {
    generatorId: 'place-value-arithmetic',
    generalLabels: [
        Area.PlaceValue,
        Scope.TwoOperands,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives
    ]
};

export const PlaceValueArithmeticGeneratorSchema = {
    operation: [[
        Area.AdditionPlaceValuePartitioning,
        Area.SubtractionPlaceValuePartitioning,
        Area.Addition,
        Area.Subtraction
    ], resolveOperation],
    requireRegrouping: [
        [Area.IntegerRegrouping],
        hasLabel(Area.IntegerRegrouping)
    ],
    requireSingleDigitSmallest: [
        [Scope.SingleDigitSmallestOperand],
        hasLabel(Scope.SingleDigitSmallestOperand)
    ],
    requireTwoDigitLargest: [
        [Scope.TwoDigitLargestOperand],
        hasLabel(Scope.TwoDigitLargestOperand)
    ],
    requireMultipleOf10: [
        [Scope.MultiplesOf10],
        hasLabel(Scope.MultiplesOf10)
    ],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    range: [
        deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000]),
        resolveRangeFromLabels
    ]
} as const;

export type PlaceValueArithmeticGeneratorConfig = ConfigFromSchema<typeof PlaceValueArithmeticGeneratorSchema>;
