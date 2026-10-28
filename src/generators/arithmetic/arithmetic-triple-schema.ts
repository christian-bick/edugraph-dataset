import {Area, deductCompatible, Scope} from 'edugraph-ts';
import {resolveRangeFromLabels} from '../../lib/ontology.ts';
import {hasLabel, selectExactLabelSetMap} from '../../lib/resolvers.ts';
import {withLabelChoices} from '../../types/schema.ts';
import type {ConfigFromSchema} from '../../types/schema.ts';
import {generatorLabelRule} from '../compatibility-rules.ts';
import {arithmeticOperations, resolvePropertyAwareOperation} from './helpers.ts';

export const arithmeticTripleLabels = [
    Scope.ThreeOperands,
    Scope.IntegerNumbers,
    Scope.Base10,
    Scope.NumbersWithoutNegatives
] as const;

const resolveMultipleOf10 = withLabelChoices(hasLabel(Scope.MultiplesOf10), {
    kind: 'alternatives',
    alternatives: [[], [Scope.MultiplesOf10], [Scope.SingleDigitSmallestOperand], [Scope.TwoDigitSmallestOperand]],
    defaults: [
        {whenAll: [Area.Addition, Scope.NumbersSmaller20], whenNone: [Area.DistributiveLaw],
            labels: [Scope.SingleDigitSmallestOperand]},
        {whenAll: [Area.Addition, Scope.NumbersLarger10, Scope.NumbersSmaller100],
            whenNone: [Scope.NumbersWithZero, Area.DistributiveLaw], labels: [Scope.TwoDigitSmallestOperand]},
        {labels: []}
    ]
});

export const arithmeticTripleWidthRule = generatorLabelRule('proved-triple-operand-width', [
    Area.Addition, Area.DistributiveLaw, Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand,
    Scope.NumbersSmaller20, Scope.NumbersLarger10, Scope.NumbersSmaller100, Scope.NumbersWithZero
], selected => {
    if (selected(Scope.SingleDigitSmallestOperand) && !selected(Area.DistributiveLaw)
        && !(selected(Area.Addition) && selected(Scope.NumbersSmaller20))) return false;
    return !selected(Scope.TwoDigitSmallestOperand)
        || selected(Area.Addition) && selected(Scope.NumbersLarger10) && selected(Scope.NumbersSmaller100)
        && !selected(Scope.NumbersWithZero) && !selected(Area.DistributiveLaw);
});

export const arithmeticTripleSchema = {
    operation: [[...arithmeticOperations, Area.Sum], resolvePropertyAwareOperation],
    requireZero: [[Scope.NumbersWithZero, Scope.NumbersWithoutZero], hasLabel(Scope.NumbersWithZero),
        [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]]],
    requireMultipleOf10: [[Scope.MultiplesOf10, Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand],
        resolveMultipleOf10,
        // Retain one legacy fallback per boolean; contextual false aliases are not random choices.
        [[], [Scope.MultiplesOf10]]],
    useCommutativeLaw: [[Area.CommutativeLaw], hasLabel(Area.CommutativeLaw)],
    useAssociativeLaw: [[Area.AssociativeLaw], hasLabel(Area.AssociativeLaw)],
    useDistributiveLaw: [[Area.DistributiveLaw, Scope.SingleDigitSmallestOperand], selectExactLabelSetMap([
        [[], false],
        [[Area.DistributiveLaw], true],
        [[Area.DistributiveLaw, Scope.SingleDigitSmallestOperand], true]
    ] as const),
        [[], [Area.DistributiveLaw, Scope.SingleDigitSmallestOperand]]],
    range: [deductCompatible([Scope.NumbersLargerZero, Scope.NumbersSmaller1000000]), resolveRangeFromLabels]
} as const;

export type ArithmeticTripleSamplingConfig = ConfigFromSchema<typeof arithmeticTripleSchema>;
