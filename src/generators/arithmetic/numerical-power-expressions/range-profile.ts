import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange, type CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import type {ExactNumericValue, NumericalPowerExpressionProblem} from '../../../types/problems.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {numericProfileBundles, numericProfileLabels, singlePowerCandidates, type NumericProfile} from './numeric-profiles.ts';

export const powerRangeLabels = [Scope.NumbersSmaller5, Scope.NumbersSmaller10,
    Scope.NumbersSmaller20, Scope.NumbersSmaller100] as const;
export const powerRanges = [5, 10, 20, 100].map(upper => createCanonicalNumericRange(upper));
const selectPowerRange = selectExactLabelMap(powerRangeLabels.map((label, index) => [label, powerRanges[index]!] as const));
export const powerRangeContext = [Area.OrderOfOperations, Scope.PositiveExponent, ...numericProfileLabels];
export const resolvePowerRange = withLabelChoices(exactResolver((labels: string[]) => {
    const selected = labels.filter(label => powerRangeLabels.includes(label as never));
    if (selected.length !== 1) return undefined;
    const range = selectPowerRange(selected);
    return range !== undefined && permitsPowerRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: powerRangeLabels.map(label => [label]), relation: 'capability',
    contextLabels: powerRangeContext, resolvedContext: true});

export function isPowerRange(value: unknown): value is CanonicalNumericRange {
    return typeof value === 'object' && value !== null && powerRanges.some(range =>
        Object.entries(range).every(([key, bound]) => (value as Record<string, unknown>)[key] === bound));
}

/** Exact comparisons use numerical values, never rational storage components. */
export function powerValuesFitRange(values: readonly ExactNumericValue[], range: CanonicalNumericRange): boolean {
    if (!isPowerRange(range) || values.length === 0) return false;
    const magnitude = (value: ExactNumericValue) => BigInt(Math.abs(value.numerator));
    return values.every(value => magnitude(value) <= BigInt(range.max) * BigInt(value.denominator))
        && values.some(value => magnitude(value) > BigInt(range.maximumAbove) * BigInt(value.denominator))
        && values.some(value => magnitude(value) < BigInt(range.minimumBelow) * BigInt(value.denominator));
}

export function singlePowerRangeCandidates(positive: boolean, profile: NumericProfile, range: CanonicalNumericRange) {
    return singlePowerCandidates(positive, profile).filter(({base, exponent}) => powerValuesFitRange([
        base, {numerator: exponent, denominator: 1},
        {numerator: base.numerator ** exponent, denominator: base.denominator ** exponent}
    ], range));
}

export function permitsPowerRange(labels: readonly string[], range: CanonicalNumericRange): boolean {
    if (labels.includes(Area.OrderOfOperations)) return true;
    const selected = labels.filter(label => numericProfileLabels.includes(label as never));
    if (selected.length === 0) return true;
    const profile = numericProfileBundles.findIndex(bundle => bundle.length === selected.length && bundle.every(label => selected.includes(label)));
    return profile >= 0 && singlePowerRangeCandidates(labels.includes(Scope.PositiveExponent), (profile + 1) as NumericProfile, range).length > 0;
}

export function powerExpressionFitsRange(data: NumericalPowerExpressionProblem, range: CanonicalNumericRange): boolean {
    return powerValuesFitRange([...data.nodeValues.map(item => item.value),
        ...data.powerFacts.flatMap(fact => [{numerator: fact.exponent, denominator: 1},
            ...(fact.kind === 'positive-exponent' ? fact.cumulativeProducts : [])])], range);
}
