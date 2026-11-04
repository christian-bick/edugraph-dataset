import {selectExactLabelSetMap} from '../../lib/resolvers.ts';
import {withLabelChoices} from '../../types/schema.ts';
import {basicCountingProfiles, type BasicCountingContract} from './basic-counting-domain.ts';

/** Exact producer-owned alternatives keep stronger bounds selected before any count is sampled. */
function rangeSchema(contract: BasicCountingContract) {
    const profiles = basicCountingProfiles(contract), choices = profiles.map(profile => profile.labels);
    return [[...new Set(choices.flat())], withLabelChoices(selectExactLabelSetMap(
        profiles.map(profile => [profile.labels, profile.range] as const)),
    {kind: 'alternatives', alternatives: choices, relation: 'capability'}), choices] as const;
}

export const enumerationCountingRangeSchema = rangeSchema('enumeration');
export const totalCountingRangeSchema = rangeSchema('total');
