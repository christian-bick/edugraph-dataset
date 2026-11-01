import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import {orderedContextRangeProfiles} from '../ordered-context-ranges.ts';

export const spec: GeneratorSpec = {
    generatorId: 'rational-order-contexts',
    generalLabels: [Area.Inequality, Scope.RationalNumbers]
};

const rangeChoices = orderedContextRangeProfiles.map(profile => profile.labels);
export const RationalOrderContextsGeneratorSchema = {
    signDomain: [[Scope.NumbersWithNegatives, Scope.NumbersWithoutNegatives], selectExactLabelMap([
        [Scope.NumbersWithNegatives, 'signed'], [Scope.NumbersWithoutNegatives, 'nonnegative']
    ] as const)],
    relation: [[Scope.Less, Scope.Greater], selectExactLabelMap([
        [Scope.Less, 'less'], [Scope.Greater, 'greater']
    ] as const)],
    range: [[...new Set(rangeChoices.flat())], withLabelChoices(selectExactLabelSetMap(
        orderedContextRangeProfiles.map(profile => [profile.labels, profile.range] as const)
    ), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'}), rangeChoices]
} as const;

export type RationalOrderContextsGeneratorConfig = ConfigFromSchema<typeof RationalOrderContextsGeneratorSchema>;
