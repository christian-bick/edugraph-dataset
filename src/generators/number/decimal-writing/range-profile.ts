import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {decimalZeroLabels} from './zero-profile.ts';

export const decimalWholeRangeLabels = [Scope.NumbersSmaller5, Scope.NumbersSmaller10] as const;
export const decimalWholeRangeCompatibility = generatorLabelRule('decimal-whole-quantity-range',
    [...decimalZeroLabels, ...decimalWholeRangeLabels], selected =>
        !selected(Scope.NumbersWithZero) || !selected(Scope.NumbersSmaller10));
const selectRange = selectExactLabelMap([
    [Scope.NumbersSmaller5, createCanonicalNumericRange(5)],
    [Scope.NumbersSmaller10, createCanonicalNumericRange(10)]
] as const);

export const resolveDecimalWholeRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels);
    return labels.includes(Scope.NumbersWithZero) && range?.max === 10 ? undefined : range;
}), {
    kind: 'alternatives', alternatives: decimalWholeRangeLabels.map(label => [label]),
    contextLabels: decimalZeroLabels, resolvedContext: true
});
