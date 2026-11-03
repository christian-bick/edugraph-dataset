import {Area, Scope} from 'edugraph-ts';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {selectExactLabelMap, selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';
import {exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {fractionScaleUpperBounds} from '../fraction-scale-domain.ts';

const comparisonProfiles = [
    [[Area.NumericInequality, Scope.Greater, Scope.ImproperFractions], 'greater'],
    [[Area.NumericInequality, Scope.Less, Scope.ProperFractions], 'less'],
    [[Area.NumericEquality, Scope.Equal, Scope.ImproperFractions], 'equal']
] as const;
const profileLabels = [...new Set(comparisonProfiles.flatMap(([labels]) => labels))];
const ranges = [[Scope.NumbersSmaller5, 5], [Scope.NumbersSmaller10, 10], [Scope.NumbersSmaller20, 20]] as const;
const rangeLabels = ranges.map(([label]) => label);
const exactProfile = selectExactLabelSetMap(comparisonProfiles);
const resolveProfile = withLabelChoices(exactResolver((labels: string[]) => {
    const profile = exactProfile(labels), upper = ranges.find(([label]) => labels.includes(label))?.[1];
    return profile && (upper === undefined || fractionScaleUpperBounds(profile).includes(upper)) ? profile : undefined;
}), {kind: 'alternatives', alternatives: comparisonProfiles.map(([labels]) => [...labels]), contextLabels: rangeLabels});
const exactRange = selectExactLabelMap(ranges.map(([label, upper]) => [label, createCanonicalNumericRange(upper)] as const));
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const profile = exactProfile(labels), range = exactRange(labels);
    if (!profile) return range;
    return range && fractionScaleUpperBounds(profile).includes(range.max) ? range : undefined;
}), {...exactRange.labelChoices!, contextLabels: profileLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'fraction-scale-relations',
    generalLabels: [Area.ProportionalScaling, Area.Multiplication],
    compatibility: [generatorLabelRule('fraction-scale-relations-range-profile', [...profileLabels, ...rangeLabels], selected => {
        const profile = comparisonProfiles.find(([labels]) => labels.every(selected))?.[1];
        const upper = ranges.find(([label]) => selected(label))?.[1];
        return !!profile && upper !== undefined && fractionScaleUpperBounds(profile).includes(upper);
    })]
};

export const FractionScaleRelationsGeneratorSchema = {
    comparisonProfile: [[Area.NumericInequality, Area.NumericEquality, Scope.Greater, Scope.Less,
        Scope.Equal, Scope.ProperFractions, Scope.ImproperFractions], resolveProfile,
    comparisonProfiles.map(([labels]) => labels)],
    range: [rangeLabels, resolveRange, rangeLabels.map(label => [label])]
} as const;
export type FractionScaleRelationsGeneratorConfig = ConfigFromSchema<typeof FractionScaleRelationsGeneratorSchema>;
