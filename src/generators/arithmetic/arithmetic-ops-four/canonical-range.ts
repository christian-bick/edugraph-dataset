import {canonicalRangeProfiles} from '../../../lib/canonical-range-labels.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {withLabelChoices} from '../../../types/schema.ts';
import {canSampleCanonicalSum} from '../canonical-sum-sampling.ts';

export const canonicalFourRangeProfiles = canonicalRangeProfiles.filter(({range}) =>
    canSampleCanonicalSum({count: 4, range, minimumOperand: 10, maximumOperand: 99, step: 1}));
export const canonicalFourRangeChoices = canonicalFourRangeProfiles.map(({labels}) => labels);
export const canonicalFourRangeLabels = [...new Set(canonicalFourRangeChoices.flat())];

/** Unspecified lower bounds are completed to a realizable two-digit four-addend profile. */
export const resolveCanonicalFourRange = withLabelChoices(selectExactLabelSetMap(
    canonicalFourRangeProfiles.map(({labels, range}) => [labels, range] as const)
), {kind: 'alternatives', relation: 'capability', alternatives: canonicalFourRangeChoices});
