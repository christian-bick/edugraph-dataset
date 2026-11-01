import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {exactResolver, withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {comparisonFramesForRange, comparisonRangeProfiles} from './numeric-domain.ts';

const relationLabels = [Area.NumericInequality, Area.NumericEquality, Scope.Less, Scope.Equal, Scope.Greater];
const relationChoices = [
    [Area.NumericInequality, Scope.Less], [Area.NumericEquality, Scope.Equal],
    [Area.NumericInequality, Scope.Greater]
];
const resolveRelation = selectExactLabelSetMap([
    [relationChoices[0]!, 'less'], [relationChoices[1]!, 'equal'], [relationChoices[2]!, 'greater']
] as const);
const rangeChoices = comparisonRangeProfiles.map(profile => profile.labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
function permitsRange(labels: string[], range: CanonicalNumericRange): boolean {
    const relation = resolveRelation(labels);
    return relation === undefined || comparisonFramesForRange(relation, range).length > 0;
}
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range !== undefined && permitsRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability',
    contextLabels: relationLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'ratio-table-comparisons',
    generalLabels: [
        Area.RatioAntecedentInterpretation, Area.RatioConsequentInterpretation,
        Area.RatioEquivalence, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ],
    compatibility: [generatorLabelRule('comparison-canonical-range', [...relationLabels, ...rangeLabels], selected => {
        const labels = [...relationLabels, ...rangeLabels].filter(selected);
        const range = resolveCanonicalRangeFromLabels(labels);
        return range !== undefined && permitsRange(labels, range);
    })]
};

export const RatioTableComparisonsGeneratorSchema = {
    relation: [relationLabels, resolveRelation, relationChoices],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;
export type RatioTableComparisonsGeneratorConfig = ConfigFromSchema<typeof RatioTableComparisonsGeneratorSchema>;
