import {Area, Scope} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const largestOperandWidthLabels = [
    Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand
] as const;

const excludedWidthContexts = [
    Scope.NumbersWithNegatives, Scope.NumbersWithZero, Scope.MultiplesOf10,
    Scope.NumbersSmaller5, Scope.NumbersSmaller10,
    Scope.NumbersLarger5, Scope.NumbersLarger10, Scope.NumbersLarger20,
    Scope.NumbersLarger100, Scope.NumbersLarger120, Scope.NumbersLarger1000,
    Scope.NumbersLarger10000, Scope.NumbersLarger100000, Scope.NumbersLarger1000000
] as const;

export const operandWidthContextLabels = [
    Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division,
    Area.IteratedOperation, Scope.NumbersSmaller20, ...excludedWidthContexts
] as const;

type LabelSelection = (label: string) => boolean;

/** These profiles partition the existing positive addition/subtraction support from 1 through 20. */
export const usesLargestOperandWidthProfiles = (selected: LabelSelection): boolean =>
    (selected(Area.Addition) || selected(Area.Subtraction) && !selected(Area.IteratedOperation))
    && selected(Scope.NumbersSmaller20)
    && !excludedWidthContexts.some(label => selected(label));

export const permitsLargestOperandWidth = (selected: LabelSelection, digits: 1 | 2): boolean =>
    usesLargestOperandWidthProfiles(selected)
    || digits === 1 && selected(Scope.NumbersSmaller5) && !selected(Scope.MultiplesOf10);

export type LargestOperandDigits = 0 | 1 | 2;

/** Zero preserves the original sampler; a width binding selects its mathematical subdomain. */
export const resolveLargestOperandDigits = withLabelChoices(exactResolver(
    (labels: string[]): LargestOperandDigits | undefined => {
        const selected = (label: string) => labels.includes(label);
        const widths = largestOperandWidthLabels.filter(label => selected(label));
        if (widths.length > 1) return undefined;
        if (widths.length === 1) {
            const digits = widths[0] === Scope.SingleDigitLargestOperand ? 1 : 2;
            // Each standalone fallback is a valid profile. Contextual requests must also
            // satisfy the same mathematical boundary enforced by matching.
            return !operandWidthContextLabels.some(label => selected(label))
                || permitsLargestOperandWidth(selected, digits) ? digits : undefined;
        }
        return usesLargestOperandWidthProfiles(selected) ? undefined : 0;
    }
), {
    kind: 'alternatives',
    alternatives: [[], ...largestOperandWidthLabels.map(label => [label])],
    contextLabels: operandWidthContextLabels,
    defaults: [
        // Preserve the former requireMultipleOf10 false alias, including its override order.
        {whenAll: [Scope.NumbersSmaller5],
            whenNone: [Scope.MultiplesOf10, Scope.SingleDigitSmallestOperand, Scope.TwoDigitSmallestOperand],
            labels: [Scope.SingleDigitLargestOperand]},
        ...excludedWidthContexts.map(label => ({whenAll: [label], labels: []}))
    ]
});
