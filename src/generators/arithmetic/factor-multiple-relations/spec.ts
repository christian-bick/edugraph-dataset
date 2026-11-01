import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {factorMultipleRangeProfiles} from './domain.ts';

export const spec: GeneratorSpec = {
    generatorId: 'factor-multiple-relations',
    generalLabels: [
        Area.FactorsAndMultiples,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithoutZero
    ],
    compatibility: [generatorLabelRule('factor-proof-positive-floor',
        [Area.PerfectDivisibility, Scope.NumbersLarger5], selected =>
            !selected(Scope.NumbersLarger5) || selected(Area.PerfectDivisibility))]
};

const rangeChoices = factorMultipleRangeProfiles.map(profile => profile.labels);
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range?.min === 5 && !labels.includes(Area.PerfectDivisibility) ? undefined : range;
}), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability',
    contextLabels: [Area.PerfectDivisibility], resolvedContext: true});

export const FactorMultipleRelationsGeneratorSchema = {
    task: [[Area.PerfectDivisibility], selectExactLabelSetMap([
        [[Area.PerfectDivisibility], 'one-digit-multiple-test'],
        [[], 'factor-pairs']
    ]), [[], [Area.PerfectDivisibility]]],
    // A positive floor needs the explicit divisibility context; it is not a context-free fallback.
    range: [[...new Set(rangeChoices.flat())], resolveRange,
        rangeChoices.filter(labels => !labels.includes(Scope.NumbersLarger5))]
} as const;

export type FactorMultipleRelationsGeneratorConfig = ConfigFromSchema<typeof FactorMultipleRelationsGeneratorSchema>;
