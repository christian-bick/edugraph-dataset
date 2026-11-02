import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema, withLabelChoices} from '../../../types/schema.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {teenRangeProfiles} from './numeric-domain.ts';

export const spec: GeneratorSpec = {
    generatorId: 'place-value-teen',
    generalLabels: [
        Area.PlaceValue,
        Area.Sum,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives]
};


const rangeChoices = teenRangeProfiles.map(profile => profile.labels);
export const PlaceValueTeenGeneratorSchema = {
    range: [
        [...new Set(rangeChoices.flat())],
        withLabelChoices(selectExactLabelSetMap(teenRangeProfiles.map(profile => [profile.labels, profile.range] as const)),
            {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'}), rangeChoices
    ]
} as const;

export type PlaceValueTeenGeneratorConfig = ConfigFromSchema<typeof PlaceValueTeenGeneratorSchema>;
