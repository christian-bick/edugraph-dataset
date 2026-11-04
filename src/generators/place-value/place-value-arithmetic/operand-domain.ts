import {Area, Scope} from 'edugraph-ts';
import {registerStaticResolver} from '../../../lib/static-resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const originalOperandLabels = [Scope.SingleDigitSmallestOperand,
    Scope.TwoDigitLargestOperand, Scope.MultiplesOf10,
    Area.Addition, Area.AdditionPlaceValuePartitioning, Area.Subtraction, Area.SubtractionPlaceValuePartitioning] as const;
type Selected = (label: string) => boolean;

/** Original mathematical domain constraints; completed width labels never select a sampler. */
export const originalOperandFlags = (selected: Selected) => {
    const subtraction = selected(Area.Subtraction) || selected(Area.SubtractionPlaceValuePartitioning);
    return {
        requireSingleDigitSmallest: !subtraction && selected(Scope.SingleDigitSmallestOperand) && selected(Scope.TwoDigitLargestOperand),
        requireTwoDigitLargest: !subtraction && selected(Scope.TwoDigitLargestOperand)
            && (selected(Scope.SingleDigitSmallestOperand) || selected(Scope.MultiplesOf10))
    };
};

// Target bindings retain the old domain even when a broad request completes to
// the same exact width. In particular general21 retains both operand orders.
export const resolveOriginalSingleDigit = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]) => originalOperandFlags(label => labels.includes(label)).requireSingleDigitSmallest
), {kind: 'target'}));
export const resolveOriginalTwoDigit = registerStaticResolver(withLabelChoices(exactResolver(
    (labels: string[]) => originalOperandFlags(label => labels.includes(label)).requireTwoDigitLargest
), {kind: 'target'}));
