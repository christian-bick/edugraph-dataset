import {Scope} from 'edugraph-ts';
import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';

export const quotientRangeMappings = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10],
    [Scope.NumbersSmaller20, 20], [Scope.NumbersSmaller100, 100]] as const;
export const quotientRangeLabels = quotientRangeMappings.map(([label]) => label);
export const quotientRangeChoices = [[], ...quotientRangeLabels.map(label => [label])];
export const originalQuotientRange: CanonicalNumericRange = {min: 0, max: Number.MAX_SAFE_INTEGER, maximumAbove: -1, minimumBelow: 5};
const selectRange = selectExactLabelMap(quotientRangeMappings.map(([label, upper]) => [label, createCanonicalNumericRange(upper)] as const));
const roleLabels = [Scope.FractionNumbers, Scope.FractionDividend, Scope.IntegerDividend, Scope.IntegerDivisor,
    Scope.FractionDivisor, Scope.NumbersWithZero, Scope.NumbersWithoutZero];

export const quotientRangeRole = (labels: readonly string[]) => labels.includes(Scope.FractionNumbers) ? 'notation'
    : labels.includes(Scope.FractionDividend) ? 'unit-dividend'
        : labels.includes(Scope.IntegerDividend) && labels.includes(Scope.IntegerDivisor) ? 'whole-sharing'
            : labels.includes(Scope.FractionDivisor) ? 'unit-divisor' : undefined;
export const quotientUpperBounds = (role: ReturnType<typeof quotientRangeRole>, zero: boolean): readonly number[] =>
    role === 'unit-dividend' ? [] : role === 'unit-divisor' ? zero ? [5] : [5, 10, 20, 100] : [5, 10];
export const resolveQuotientRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = selectRange(labels), role = quotientRangeRole(labels);
    if (!role) return range ?? originalQuotientRange;
    if (role === 'unit-dividend') return range ? undefined : originalQuotientRange;
    return range && quotientUpperBounds(role, labels.includes(Scope.NumbersWithZero)).includes(range.max) ? range : undefined;
}), {kind: 'alternatives', alternatives: quotientRangeChoices, contextLabels: roleLabels, resolvedContext: true});
