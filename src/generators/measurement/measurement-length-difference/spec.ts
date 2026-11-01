import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {withLabelChoices} from '../../../types/schema.ts';
import {lengthDifferenceRangeProfiles} from './numeric-domain.ts';
export const spec: GeneratorSpec = {
    generatorId: 'measurement-length-difference',
    generalLabels: [Area.Difference, Scope.CentimeterScale, Scope.DirectRelation,
        Scope.IntegerNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]
};
const rangeChoices = lengthDifferenceRangeProfiles.map(profile => profile.labels);
export const MeasurementLengthDifferenceGeneratorSchema = {
    range: [[...new Set(rangeChoices.flat())], withLabelChoices(selectExactLabelSetMap(
        lengthDifferenceRangeProfiles.map(profile => [profile.labels, profile.range] as const)
    ), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'}), rangeChoices]
} as const;
export type MeasurementLengthDifferenceGeneratorConfig=ConfigFromSchema<typeof MeasurementLengthDifferenceGeneratorSchema>;
