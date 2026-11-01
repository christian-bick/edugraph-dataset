import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {exactResolver, withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {directedContextCaseCount, signedContextRangeProfiles} from './numeric-domain.ts';

const relationProfiles = [
    [[Area.Zero, Scope.NumbersWithZero, Scope.NumbersWithoutNegatives], 'reference-zero'],
    [[Area.SignNotation, Scope.NumbersWithNegatives], 'directed-pair']
] as const;
const canonicalProfiles = relationProfiles.map(([labels, value]) => [
    value === 'directed-pair' ? [...labels, Scope.NumbersWithoutZero] : labels, value
] as const);
const relationLabels = [Area.Zero, Scope.NumbersWithZero, Scope.NumbersWithoutNegatives, Area.SignNotation,
    Scope.NumbersWithNegatives, Scope.NumbersWithoutZero];
const resolveRelation = selectExactLabelSetMap([...canonicalProfiles, relationProfiles[1]]);
const rangeChoices = signedContextRangeProfiles.map(profile => profile.labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
const permitsRange = (labels: string[]) => {
    const relation = resolveRelation(labels), range = resolveCanonicalRangeFromLabels(labels);
    return range !== undefined && directedContextCaseCount(range) > 0
        && (relation !== 'reference-zero' || range.max === 5 && range.min === 0);
};
const resolveRange = withLabelChoices(exactResolver((labels: string[]) =>
    permitsRange(labels) ? resolveCanonicalRangeFromLabels(labels) : undefined),
{kind: 'alternatives', alternatives: rangeChoices, relation: 'capability', contextLabels: relationLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'signed-rational-contexts',
    generalLabels: [Scope.RationalNumbers],
    compatibility: [generatorLabelRule('signed-context-canonical-range', [...relationLabels, ...rangeLabels], selected =>
        permitsRange([...relationLabels, ...rangeLabels].filter(selected)))]
};

export const SignedRationalContextsGeneratorSchema = {
    relation: [
        relationLabels,
        resolveRelation,
        canonicalProfiles.map(([labels]) => labels)
    ],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;

export type SignedRationalContextsGeneratorConfig = ConfigFromSchema<typeof SignedRationalContextsGeneratorSchema>;
