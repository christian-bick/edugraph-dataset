import {Scope} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

/**
 * The false mathematical branch contains no zero operands or result. A requested
 * number line may still display its zero origin, so retain that branch's former
 * unannotated binding until reference-frame ownership is handled separately.
 */
export const resolveZeroOccurrence = withLabelChoices(exactResolver((labels: string[]): boolean | undefined => {
    const withZero = labels.includes(Scope.NumbersWithZero);
    const withoutZero = labels.includes(Scope.NumbersWithoutZero);
    if (withZero && withoutZero || withoutZero && labels.includes(Scope.Numberline)) return undefined;
    return withZero;
}), {
    kind: 'alternatives',
    alternatives: [[], [Scope.NumbersWithZero], [Scope.NumbersWithoutZero]],
    contextLabels: [Scope.Numberline],
    defaults: [
        {whenAll: [Scope.Numberline], labels: []},
        {labels: [Scope.NumbersWithoutZero]}
    ]
});
