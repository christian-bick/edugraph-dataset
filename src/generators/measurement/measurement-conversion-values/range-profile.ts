import {Scope} from 'edugraph-ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {measurementConversionUnitPairSchema} from '../conversion-schema.ts';
import {conversionValueRangeProfiles, conversionValueTuples} from './numeric-domain.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

export const numericProfileFallbacks = [[Scope.IntegerNumbers], [Scope.DecimalNumbers]] as const;
export const resolveNumericProfile = selectExactLabelSetMap([
    [numericProfileFallbacks[0], 'integer'], [numericProfileFallbacks[1], 'decimal']
] as const);
export const conversionRangeChoices = conversionValueRangeProfiles.map(profile => profile.labels);
export const conversionRangeLabels = [...new Set(conversionRangeChoices.flat())];
export const conversionRangeContext = [...measurementConversionUnitPairSchema[0], Scope.IntegerNumbers, Scope.DecimalNumbers];

export function permitsConversionValueRange(labels: string[], range: CanonicalNumericRange): boolean {
    const pair = measurementConversionUnitPairSchema[1](labels);
    const kind = resolveNumericProfile(labels);
    return pair === undefined || kind === undefined || conversionValueTuples(pair, kind, range).length > 0;
}

export const resolveConversionValueRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range !== undefined && permitsConversionValueRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: conversionRangeChoices, relation: 'capability',
    contextLabels: conversionRangeContext, resolvedContext: true});
