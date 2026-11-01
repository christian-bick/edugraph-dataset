import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import {liquidEstimateRangeProfiles} from './numeric-domain.ts';

export const spec: GeneratorSpec = {
    generatorId: 'measurement-liquid-volume-estimation',
    generalLabels: [Area.Estimation, Area.MeasuringVolume, Scope.LiquidVolumes, Scope.LiterScale,
        Scope.IntegerNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
};
const rangeChoices = liquidEstimateRangeProfiles.map(profile => profile.labels);
export const MeasurementLiquidVolumeEstimationGeneratorSchema = {
    range: [[...new Set(rangeChoices.flat())], withLabelChoices(selectExactLabelSetMap(
        liquidEstimateRangeProfiles.map(profile => [profile.labels, profile.range] as const)
    ), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'}), rangeChoices]
} as const;
export type MeasurementLiquidVolumeEstimationGeneratorConfig = ConfigFromSchema<typeof MeasurementLiquidVolumeEstimationGeneratorSchema>;
