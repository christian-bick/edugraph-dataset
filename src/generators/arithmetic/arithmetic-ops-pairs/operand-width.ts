import {Area, Scope} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const largestOperandWidthLabels = [
    Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand,
    Scope.ThreeDigitLargestOperand, Scope.FourDigitLargestOperand, Scope.MultipleDigitLargestOperand
] as const;

const largestOperandWidthValues = [1, 2, 3, 4, 'multiple'] as const;
export type LargestOperandDigits = 0 | typeof largestOperandWidthValues[number];
export const largestOperandWidthValue = (label: typeof largestOperandWidthLabels[number]): Exclude<LargestOperandDigits, 0> =>
    largestOperandWidthValues[largestOperandWidthLabels.indexOf(label)]!;

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
    Scope.NumbersSmaller1000, Scope.NumbersSmaller10000, Scope.NumbersSmaller100000,
    Scope.NumbersSmaller1000000, ...excludedWidthContexts
] as const;

type LabelSelection = (label: string) => boolean;

/** Finite extensions retain the existing inclusive range semantics. */
const profileBound = (selected: LabelSelection): number => selected(Scope.NumbersSmaller20) ? 20
    : selected(Scope.NumbersSmaller100) ? 100
    : selected(Scope.NumbersSmaller120) ? 120
    : selected(Scope.NumbersSmaller1000) ? 1000
    : selected(Scope.NumbersSmaller10000) ? 10000
    : selected(Scope.NumbersSmaller100000) ? 100000
    : selected(Scope.NumbersSmaller1000000) ? 1000000 : 0;

const usesUnboundedOperandWidthProfiles = (selected: LabelSelection): boolean =>
    profileBound(selected) === 0 && !selected(Area.IteratedOperation)
    && [Area.Addition, Area.Subtraction, Area.Multiplication, Area.Division].some(label => selected(label))
    && !excludedWidthContexts.some(label => selected(label));

export const usesLargestOperandWidthProfiles = (selected: LabelSelection): boolean =>
    ((selected(Area.Addition) || selected(Area.Subtraction) && !selected(Area.IteratedOperation))
        && [20, 100, 1000].includes(profileBound(selected))
        || (selected(Area.Multiplication) || selected(Area.Division))
            && !selected(Area.IteratedOperation) && profileBound(selected) === 100)
    && !excludedWidthContexts.some(label => selected(label))
    || usesUnboundedOperandWidthProfiles(selected);

export const permitsLargestOperandWidth = (selected: LabelSelection, digits: Exclude<LargestOperandDigits, 0>): boolean =>
    (usesUnboundedOperandWidthProfiles(selected) ? digits === 1 || digits === 'multiple'
        : digits !== 'multiple' && usesLargestOperandWidthProfiles(selected)
        && 10 ** (digits - 1) <= profileBound(selected) - (selected(Area.Addition) ? 1 : 0)
    )
    || digits === 1 && selected(Scope.NumbersSmaller5) && !selected(Scope.MultiplesOf10);

/** Zero preserves the original sampler; a width binding selects its mathematical subdomain. */
export const resolveLargestOperandDigits = withLabelChoices(exactResolver(
    (labels: string[]): LargestOperandDigits | undefined => {
        const selected = (label: string) => labels.includes(label);
        const widths = largestOperandWidthLabels.filter(label => selected(label));
        const precise = widths.filter(label => label !== Scope.MultipleDigitLargestOperand);
        // A broad request may be completed by one precise multiple-digit alternative.
        // Single versus multiple, or two competing exact widths, remain conflicting claims.
        if (widths.length > 1 && (widths.length !== 2 || precise.length !== 1
            || precise[0] === Scope.SingleDigitLargestOperand)) return undefined;
        if (widths.length) {
            const digits = largestOperandWidthValue(precise[0] ?? widths[0]!);
            // Each standalone fallback is a valid profile. Contextual requests must also
            // satisfy the same mathematical boundary enforced by matching.
            return !operandWidthContextLabels.some(label => selected(label))
                || permitsLargestOperandWidth(selected, digits) ? digits : undefined;
        }
        return usesLargestOperandWidthProfiles(selected) ? undefined : 0;
    }
), {
    kind: 'alternatives',
    relation: 'capability',
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
