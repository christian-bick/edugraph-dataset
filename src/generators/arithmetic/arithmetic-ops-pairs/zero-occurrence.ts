import {Scope} from 'edugraph-ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

/** The false mathematical branch contains no zero operands or result. */
export const resolveZeroOccurrence = withLabelChoices(exactResolver((labels: string[]): boolean | undefined => {
    const withZero = labels.includes(Scope.NumbersWithZero);
    const withoutZero = labels.includes(Scope.NumbersWithoutZero);
    if (withZero && withoutZero) return undefined;
    return withZero;
}), {
    kind: 'alternatives',
    alternatives: [[Scope.NumbersWithZero], [Scope.NumbersWithoutZero]],
    defaults: [{labels: [Scope.NumbersWithoutZero]}]
});
