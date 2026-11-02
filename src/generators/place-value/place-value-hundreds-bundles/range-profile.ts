import {Area} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {hundredsBundleRangeProfiles, hundredsBundleRows} from './numeric-domain.ts';

export const hundredsBundleRangeChoices = hundredsBundleRangeProfiles.map(profile => profile.labels);
export const hundredsBundleRangeLabels = [...new Set(hundredsBundleRangeChoices.flat())];
const baseRange = selectExactLabelSetMap(hundredsBundleRangeProfiles.map(profile => [profile.labels, profile.range] as const));
export const resolveHundredsBundleRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = baseRange(labels);
    return range && hundredsBundleRows(range, labels.includes(Area.IntegerRegrouping)).length ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: hundredsBundleRangeChoices,
    contextLabels: [Area.IntegerRegrouping], resolvedContext: true});
