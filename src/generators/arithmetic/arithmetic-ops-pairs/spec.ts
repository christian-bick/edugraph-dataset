import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../../lib/ontology.ts';
import {hasAllLabels, hasLabel} from '../../../lib/resolvers.ts';
import {ConfigFromSchema, withLabelChoices} from '../../../types/schema.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {arithmeticOperations, resolveDeclaredOperation} from '../helpers.ts';
import {largestOperandWidthLabels, operandWidthContextLabels, permitsLargestOperandWidth,
    resolveLargestOperandDigits, usesLargestOperandWidthProfiles} from './operand-width.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';


const operandWidthLabels = [
    Scope.SingleDigitSmallestOperand,
    Scope.TwoDigitSmallestOperand
] as const;

const multipleDigitLowerBounds = [
    Scope.NumbersLarger10, Scope.NumbersLarger20, Scope.NumbersLarger100, Scope.NumbersLarger120,
    Scope.NumbersLarger1000, Scope.NumbersLarger10000, Scope.NumbersLarger100000, Scope.NumbersLarger1000000
] as const;

// The false aliases describe widths already guaranteed by the requested operation and bounds.
// Keep the existing boolean resolver and only the original two fallback values.
const resolveMultipleOf10 = withLabelChoices(hasLabel(Scope.MultiplesOf10), {
    kind: 'alternatives',
    alternatives: [[], [Scope.MultiplesOf10], ...operandWidthLabels.map(label => [label])],
    defaults: [
        {whenAll: [Scope.NumbersSmaller5], labels: []},
        {whenAll: [Area.Addition, Scope.NumbersSmaller10],
            whenNone: [Scope.NumbersWithZero, Scope.NumbersWithNegatives],
            labels: [Scope.SingleDigitSmallestOperand]},
        {whenAll: [Area.Subtraction, Scope.NumbersSmaller10],
            whenNone: [Scope.NumbersWithZero, Scope.NumbersWithNegatives],
            labels: [Scope.SingleDigitSmallestOperand]},
        {whenAll: [Area.Addition, Scope.NumbersLarger10, Scope.NumbersSmaller100],
            whenNone: [Scope.NumbersWithZero, Scope.NumbersWithNegatives],
            labels: [Scope.TwoDigitSmallestOperand]},
        {labels: []}
    ]
});

const operandWidthRule = generatorLabelRule('operand-width-existing-domain', [
    ...operandWidthLabels, Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division,
    Scope.NumbersWithZero, Scope.NumbersWithNegatives, Scope.MultiplesOf10,
    Scope.NumbersSmaller5, Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100,
    ...multipleDigitLowerBounds
], selected => {
    const allSingle = selected(Scope.NumbersSmaller5);
    const positiveNoZero = !selected(Scope.NumbersWithZero) && !selected(Scope.NumbersWithNegatives);
    const smallBound = selected(Scope.NumbersSmaller10);
    const wholeTensOrLarger = multipleDigitLowerBounds.some(label => selected(label));
    return (!selected(Scope.SingleDigitSmallestOperand) || allSingle
            || smallBound && positiveNoZero && (selected(Area.Addition) || selected(Area.Subtraction)))
        && (!selected(Scope.TwoDigitSmallestOperand)
            || selected(Area.Addition) && wholeTensOrLarger && selected(Scope.NumbersSmaller100)
                && positiveNoZero && !selected(Scope.MultiplesOf10));
});

const largestOperandWidthRule = generatorLabelRule('largest-operand-width-domain', [
    ...largestOperandWidthLabels, ...operandWidthContextLabels
], selected => {
    const single = selected(Scope.SingleDigitLargestOperand);
    const two = selected(Scope.TwoDigitLargestOperand);
    if (single && two) return false;
    if (single || two) return permitsLargestOperandWidth(selected, single ? 1 : 2);
    return !usesLargestOperandWidthProfiles(selected);
});

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-ops-pairs',
    compatibility: [generatorLabelRule('equal-addends-domain', [
        Area.Addition, Area.IteratedOperation, Scope.NumbersWithNegatives, Scope.NumbersWithZero
    ], selected => !(selected(Area.Addition) && selected(Area.IteratedOperation))
        || !selected(Scope.NumbersWithNegatives) && !selected(Scope.NumbersWithZero)),
        operandWidthRule, largestOperandWidthRule],
    generalLabels: [
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.TwoOperands,
        Scope.SingleStep
    ]
};

export const ArithmeticOpsPairsGeneratorSchema = {
    operation: [arithmeticOperations, resolveDeclaredOperation],
    requireNegative: [
        [Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives],
        hasLabel(Scope.NumbersWithNegatives),
        [[Scope.NumbersWithNegatives], [Scope.NumbersWithoutNegatives]]
    ],
    requireZero: [
        [Scope.NumbersWithZero, Scope.NumbersWithoutZero],
        hasLabel(Scope.NumbersWithZero)
    ],
    requireMultipleOf10: [
        [Scope.MultiplesOf10, ...operandWidthLabels],
        resolveMultipleOf10,
        [[], [Scope.MultiplesOf10]]
    ],
    largestOperandDigits: [
        largestOperandWidthLabels,
        resolveLargestOperandDigits,
        [[], ...largestOperandWidthLabels.map(label => [label])]
    ],
    requireEqualAddends: [
        [Area.IteratedOperation],
        hasAllLabels([Area.Addition, Area.IteratedOperation])
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
