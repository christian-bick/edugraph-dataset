import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import {unitRateRangeProfiles} from './numeric-domain.ts';

export const spec: GeneratorSpec = {
    generatorId: 'unit-rate-relations',
    generalLabels: [
        Area.RatioAntecedentInterpretation, Area.RatioConsequentInterpretation,
        Area.RatioEquivalence, Area.Division, Area.ProportionalScaling,
        Scope.RationalNumbers, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero
    ]
};
const rangeChoices = unitRateRangeProfiles.map(profile => profile.labels);
export const UnitRateRelationsGeneratorSchema = {
    range: [[...new Set(rangeChoices.flat())], withLabelChoices(selectExactLabelSetMap(
        unitRateRangeProfiles.map(profile => [profile.labels, profile.range] as const)
    ), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'}), rangeChoices]
} as const;
export type UnitRateRelationsGeneratorConfig = ConfigFromSchema<typeof UnitRateRelationsGeneratorSchema>;
