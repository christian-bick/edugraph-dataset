import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {withLabelChoices} from '../../../types/schema.ts';
import {equalGroupCollectionsWithin} from './collections.ts';

/** Every declared alternative has complete finite mathematical support before sampling. */
export const equalGroupsRangeProfiles = canonicalRangeProfiles.filter(({range}) =>
    range.max <= 100 && equalGroupCollectionsWithin(range).length > 0);
export const equalGroupsRangeChoices = equalGroupsRangeProfiles.map(({labels}) => labels);
export const equalGroupsRangeLabels = [...new Set(equalGroupsRangeChoices.flat())];
export const resolveEqualGroupsRange = withLabelChoices(selectExactLabelSetMap(
    equalGroupsRangeProfiles.map(({labels, range}) => [labels, range] as const)
), {kind: 'alternatives', relation: 'capability', alternatives: equalGroupsRangeChoices});
