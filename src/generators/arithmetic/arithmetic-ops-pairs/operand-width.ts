import {Area, Scope} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {canonicalRangeLabels, canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {arithmeticOperations, operationNames} from '../helpers.ts';
import {canSampleCanonicalPair, type CanonicalPairConfig} from '../canonical-pair-sampling.ts';

export const largestOperandWidthLabels = [
    Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand,
    Scope.ThreeDigitLargestOperand, Scope.FourDigitLargestOperand, Scope.MultipleDigitLargestOperand
] as const;
const widths = [1, 2, 3, 4, 'multiple'] as const;
export type LargestOperandDigits = typeof widths[number];
export const largestOperandWidthValue = (label: typeof largestOperandWidthLabels[number]): LargestOperandDigits =>
    widths[largestOperandWidthLabels.indexOf(label)]!;

export const canonicalPairContextLabels = [...arithmeticOperations, ...canonicalRangeLabels,
    Scope.NumbersWithNegatives, Scope.NumbersWithZero, Scope.MultiplesOf10, Area.IteratedOperation, Scope.EvenNumbers];

export function canonicalPairConfigFromSelection(selected: (label: string) => boolean, digits: LargestOperandDigits): CanonicalPairConfig | null {
    const operations = arithmeticOperations.filter(selected);
    const rangeLabels = canonicalRangeLabels.filter(selected);
    const profile = canonicalRangeProfiles.find(candidate => candidate.labels.length === rangeLabels.length
        && candidate.labels.every(selected));
    return operations.length === 1 && profile !== undefined ? {
        operation: operationNames[operations[0]!], range: profile.range, largestOperandDigits: digits,
        requireNegative: selected(Scope.NumbersWithNegatives), requireZero: selected(Scope.NumbersWithZero),
        requireMultipleOf10: selected(Scope.MultiplesOf10), requireEqualAddends: selected(Area.IteratedOperation),
        requireEvenResult: selected(Scope.EvenNumbers)
    } : null;
}

/** Broad multiple-digit requests may be completed by a more precise admitted alternative. */
export const resolveLargestOperandDigits = withLabelChoices(exactResolver((labels: string[]): LargestOperandDigits | undefined => {
    const selected = largestOperandWidthLabels.filter(label => labels.includes(label));
    const precise = selected.filter(label => label !== Scope.MultipleDigitLargestOperand);
    if (precise.length > 1 || precise.length === 1 && selected.length > 1 && precise[0] === Scope.SingleDigitLargestOperand) return undefined;
    const label = precise[0] ?? selected[0];
    if (label === undefined) return undefined;
    const digits = largestOperandWidthValue(label);
    if (!canonicalPairContextLabels.some(context => labels.includes(context))) return digits;
    const config = canonicalPairConfigFromSelection(context => labels.includes(context), digits);
    return config && canSampleCanonicalPair(config) ? digits : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: largestOperandWidthLabels.map(label => [label]),
    contextLabels: canonicalPairContextLabels, resolvedContext: true});
