import {Area, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../lib/resolvers.ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {exactResolver, withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-paired-patterns',
    generalLabels: [Scope.PairedPatterns, Scope.IntegerNumbers, Scope.NumbersWithoutNegatives],
    compatibility: [generatorLabelRule('paired-pattern-range-support', [Area.PatternCorrespondence, Scope.NumbersSmaller10],
        selected => !selected(Area.PatternCorrespondence) || !selected(Scope.NumbersSmaller10))]
};

const rangeChoices = canonicalRangeProfiles.filter(({range}) => range.min === 0 && [10, 20, 100].includes(range.max))
    .map(({labels}) => labels);
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range?.max === 10 && labels.includes(Area.PatternCorrespondence) ? undefined : range;
}), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability',
    contextLabels: [Area.PatternCorrespondence], resolvedContext: true});

export const ArithmeticPairedPatternsGeneratorSchema = {
    hasCorrespondence: [[Area.PatternCorrespondence], hasLabel(Area.PatternCorrespondence)],
    range: [[...new Set(rangeChoices.flat())], resolveRange, rangeChoices]
} as const;

export type ArithmeticPairedPatternsGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticPairedPatternsGeneratorSchema
>;
