import {Area, Scope} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const largestOperandWidthLabels = [
    Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand,
    Scope.ThreeDigitLargestOperand, Scope.FourDigitLargestOperand
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
    Area.IteratedOperation, Scope.NumbersSmaller20, Scope.NumbersSmaller100, Scope.NumbersSmaller120,
    Scope.NumbersSmaller1000, ...excludedWidthContexts
] as const;

type LabelSelection = (label: string) => boolean;

/** Finite extensions retain the existing inclusive range semantics. */
const profileBound = (selected: LabelSelection): number => selected(Scope.NumbersSmaller20) ? 20
    : selected(Scope.NumbersSmaller100) ? 100
    : selected(Scope.NumbersSmaller120) ? 120
    : selected(Scope.NumbersSmaller1000) ? 1000 : 0;

export const usesLargestOperandWidthProfiles = (selected: LabelSelection): boolean =>
    ((selected(Area.Addition) || selected(Area.Subtraction) && !selected(Area.IteratedOperation))
        && [20, 100, 1000].includes(profileBound(selected))
        || (selected(Area.Multiplication) || selected(Area.Division))
            && !selected(Area.IteratedOperation) && profileBound(selected) === 100)
    && !excludedWidthContexts.some(label => selected(label));

export const permitsLargestOperandWidth = (selected: LabelSelection, digits: Exclude<LargestOperandDigits, 0>): boolean =>
    usesLargestOperandWidthProfiles(selected)
        && 10 ** (digits - 1) <= profileBound(selected) - (selected(Area.Addition) ? 1 : 0)
    || digits === 1 && selected(Scope.NumbersSmaller5) && !selected(Scope.MultiplesOf10);

export type LargestOperandDigits = 0 | 1 | 2 | 3 | 4;

/** Zero preserves the original sampler; a width binding selects its mathematical subdomain. */
export const resolveLargestOperandDigits = withLabelChoices(exactResolver(
    (labels: string[]): LargestOperandDigits | undefined => {
        const selected = (label: string) => labels.includes(label);
        const widths = largestOperandWidthLabels.filter(label => selected(label));
        if (widths.length > 1) return undefined;
        if (widths.length === 1) {
            const digits = (largestOperandWidthLabels.indexOf(widths[0]!) + 1) as Exclude<LargestOperandDigits, 0>;
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
