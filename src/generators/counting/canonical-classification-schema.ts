import {selectExactLabelSetMap} from '../../lib/resolvers.ts';
import {withLabelChoices} from '../../types/schema.ts';
import {classificationRangeProfiles} from './canonical-classification-domains.ts';

const choices = classificationRangeProfiles.map(profile => profile.labels);
export const classificationRangeSchema = [[...new Set(choices.flat())],
    withLabelChoices(selectExactLabelSetMap(classificationRangeProfiles.map(profile => [profile.labels, profile.range] as const)),
        {kind: 'alternatives', relation: 'capability', alternatives: choices}), choices] as const;
