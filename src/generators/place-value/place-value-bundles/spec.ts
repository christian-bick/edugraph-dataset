import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, withLabelChoices} from '../../../types/schema.ts';
import {tensRangeProfiles} from './numeric-domain.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-bundles',
    generalLabels: [
        Area.PlaceValue,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.MultiplesOf10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ]
};

const rangeChoices = tensRangeProfiles.map(profile => profile.labels);
export const PlaceValueBundlesGeneratorSchema = {
    range: [
        [...new Set(rangeChoices.flat())],
        withLabelChoices(selectExactLabelSetMap(tensRangeProfiles.map(profile => [profile.labels, profile.range] as const)),
            {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'}), rangeChoices
    ]
} as const;

export type PlaceValueBundlesGeneratorConfig = ConfigFromSchema<typeof PlaceValueBundlesGeneratorSchema>;
