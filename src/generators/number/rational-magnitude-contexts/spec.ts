import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import {orderedContextRangeProfiles} from '../ordered-context-ranges.ts';

export const spec: GeneratorSpec = {
    generatorId: 'rational-magnitude-contexts',
    generalLabels: [Area.AbsoluteNumberMagnitude, Scope.RationalNumbers, Area.Inequality]
};

const rangeChoices = orderedContextRangeProfiles.map(profile => profile.labels);
export const RationalMagnitudeContextsGeneratorSchema = {
    signDomain: [[Scope.NumbersWithoutNegatives, Scope.NumbersWithNegatives], selectExactLabelMap([
        [Scope.NumbersWithoutNegatives, 'nonnegative'], [Scope.NumbersWithNegatives, 'signed']
    ] as const)],
    range: [[...new Set(rangeChoices.flat())], withLabelChoices(selectExactLabelSetMap(
        orderedContextRangeProfiles.map(profile => [profile.labels, profile.range] as const)
    ), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'}), rangeChoices]
} as const;

export type RationalMagnitudeContextsGeneratorConfig = ConfigFromSchema<typeof RationalMagnitudeContextsGeneratorSchema>;
