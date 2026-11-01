import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const decimalColumnRangeLabels = [Scope.NumbersSmaller10, Scope.NumbersSmaller20] as const;
export const decimalColumnZeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
const selectZero = selectExactLabelMap([[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]] as const);
const selectRange = selectExactLabelMap([
    [Scope.NumbersSmaller10, createCanonicalNumericRange(10)],
    [Scope.NumbersSmaller20, createCanonicalNumericRange(20)]
] as const);
export const resolveDecimalColumnZero = withLabelChoices(exactResolver((labels: string[]) => {
    const zero = selectZero(labels);
    return labels.includes(Scope.NumbersSmaller10) && zero === false ? undefined : zero;
}), {kind: 'alternatives', alternatives: decimalColumnZeroLabels.map(label => [label]), contextLabels: decimalColumnRangeLabels});
export const resolveDecimalColumnRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    return labels.includes(Scope.NumbersWithoutZero) && range?.max === 10 ? undefined : range;
}), {kind: 'alternatives', alternatives: decimalColumnRangeLabels.map(label => [label]),
    contextLabels: decimalColumnZeroLabels, resolvedContext: true});
