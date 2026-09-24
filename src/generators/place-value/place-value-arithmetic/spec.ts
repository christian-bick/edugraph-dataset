import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {hasLabel, selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

const resolveOperation = selectExactLabelMap([
    [Area.AdditionPlaceValuePartitioning, Area.Addition],
    [Area.SubtractionPlaceValuePartitioning, Area.Subtraction],
    [Area.Addition, Area.Addition],
    [Area.Subtraction, Area.Subtraction]
] as const);

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-arithmetic',
    compatibility: [generatorLabelRule('place-value-operand-profile', [
        Area.Addition, Area.AdditionPlaceValuePartitioning, Area.Subtraction, Area.SubtractionPlaceValuePartitioning,
        Area.IntegerRegrouping, Scope.SingleDigitSmallestOperand, Scope.TwoDigitLargestOperand,
        Scope.MultiplesOf10, Scope.NumbersWithZero
    ], selected => {
        const singleDigit = selected(Scope.SingleDigitSmallestOperand);
        const twoDigit = selected(Scope.TwoDigitLargestOperand);
        const multiples = selected(Scope.MultiplesOf10);
        const regrouping = selected(Area.IntegerRegrouping);
        const zero = selected(Scope.NumbersWithZero);
        const addition = selected(Area.Addition) || selected(Area.AdditionPlaceValuePartitioning);
        if (singleDigit && multiples || singleDigit && !twoDigit || twoDigit && !singleDigit && !multiples) return false;
        if (addition) {
            return !zero && (!multiples || twoDigit && !regrouping);
        }
        if (twoDigit || singleDigit) return false;
        return multiples ? !regrouping : !zero || !regrouping;
    })],
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
