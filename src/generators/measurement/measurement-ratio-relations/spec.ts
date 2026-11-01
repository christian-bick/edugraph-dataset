import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import {conversionRatioRangeProfiles} from './numeric-domain.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-ratio-relations',
    generalLabels: [Area.UnitConversion, Area.RatioEquivalence, Scope.RationalNumbers,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
};
const rangeChoices = conversionRatioRangeProfiles.map(profile => profile.labels);
export const MeasurementRatioRelationsGeneratorSchema = {
    range: [[...new Set(rangeChoices.flat())], withLabelChoices(selectExactLabelSetMap(
        conversionRatioRangeProfiles.map(profile => [profile.labels, profile.range] as const)
    ), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'}), rangeChoices]
} as const;
export type MeasurementRatioRelationsGeneratorConfig = ConfigFromSchema<typeof MeasurementRatioRelationsGeneratorSchema>;
