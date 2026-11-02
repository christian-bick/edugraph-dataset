import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const standardColumnRangeLabels = [Scope.NumbersSmaller10, Scope.NumbersSmaller20, Scope.NumbersSmaller100,
    Scope.NumbersSmaller120, Scope.NumbersSmaller1000, Scope.NumbersSmaller10000, Scope.NumbersSmaller100000] as const;
export const standardColumnZeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
const selectZero = selectExactLabelMap([[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]] as const);
const selectRange = selectExactLabelMap(standardColumnRangeLabels.map((label, index) =>
    [label, createCanonicalNumericRange([10, 20, 100, 120, 1000, 10000, 100000][index]!)] as const));
export const resolveStandardColumnZero = withLabelChoices(exactResolver((labels: string[]) => {
    const zero = selectZero(labels);
    return labels.includes(Scope.NumbersSmaller10) && zero === false ? undefined : zero;
}), {kind: 'alternatives', alternatives: standardColumnZeroLabels.map(label => [label]), contextLabels: standardColumnRangeLabels});
export const resolveStandardColumnRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    return labels.includes(Scope.NumbersWithoutZero) && range?.max === 10 ? undefined : range;
}), {kind: 'alternatives', alternatives: standardColumnRangeLabels.map(label => [label]), contextLabels: standardColumnZeroLabels, resolvedContext: true});
