import {Scope} from 'edugraph-ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {measurementConversionUnitPairSchema} from '../conversion-schema.ts';
import {conversionStoryRangeProfiles, conversionStoryTuples} from './numeric-domain.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

export const resolveStoryNumberKind = selectExactLabelMap([
    [Scope.IntegerNumbers, 'integer'], [Scope.DecimalNumbers, 'decimal']
] as const);
export const storyRangeChoices = conversionStoryRangeProfiles.map(profile => profile.labels);
export const storyRangeLabels = [...new Set(storyRangeChoices.flat())];
export const storyRangeContext = [...measurementConversionUnitPairSchema[0], Scope.IntegerNumbers, Scope.DecimalNumbers];
export function permitsConversionStoryRange(labels: string[], range: CanonicalNumericRange): boolean {
    const pair = measurementConversionUnitPairSchema[1](labels);
    const kind = resolveStoryNumberKind(labels);
    return pair === undefined || kind === undefined || conversionStoryTuples(pair, kind, range).length > 0;
}
export const resolveConversionStoryRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range !== undefined && permitsConversionStoryRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: storyRangeChoices, relation: 'capability',
    contextLabels: storyRangeContext, resolvedContext: true});
