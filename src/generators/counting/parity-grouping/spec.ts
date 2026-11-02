import {Area, Scope} from 'edugraph-ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {exactResolver, withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import {countingQuantityLabels, countingQuantitySchema} from '../counting-quantity-schema.ts';
import {groupingCountingRangeSchema, groupingRangeContext, permitsGroupingRange} from '../canonical-counting-schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {groupingCountingProfiles, groupingCountsForRange} from '../canonical-counting-domains.ts';

const parityLabels = [Area.EvenDivisibility, Area.UnevenDivisibility, Scope.EvenNumbers, Scope.OddNumbers] as const;
const zeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
const compatibilityLabels = [...groupingRangeContext, ...groupingCountingRangeSchema[0]];

export const spec: GeneratorSpec = {
    generatorId: 'parity-grouping',
    generalLabels: countingQuantityLabels,
    compatibility: [generatorLabelRule('parity-grouping-positive-domain', compatibilityLabels, selected =>
        permitsGroupingRange(compatibilityLabels.filter(selected)))]
};

const parityChoices = countingQuantitySchema.parity[2];
const evenChoices = parityChoices.slice(0, 3);
const oddChoices = parityChoices.slice(3);
const evenProfiles = evenChoices.map(labels => [[...labels, Scope.NumbersWithZero], 'even'] as const);
const oddProfiles = oddChoices.flatMap(labels => [
    [[...labels, Scope.NumbersWithZero], 'singleton-odd'],
    [[...labels, Scope.NumbersWithoutZero], 'positive-odd']
] as const);
// A zero remainder belongs to even groups; two empty groups belong only to
// singleton odd collections. Other odd collections involve positive counts.
const baseGroupingParity = selectExactLabelSetMap([
    ...evenChoices.map(labels => [labels, 'even'] as const), ...evenProfiles, ...oddProfiles
] as const);
const parityAlternatives = [...evenProfiles, ...oddProfiles].map(([labels]) => labels);
const resolveGroupingParity = withLabelChoices(exactResolver((labels: string[]) => {
    const parity = baseGroupingParity(labels);
    const ranges = groupingCountingProfiles.filter(profile => profile.labels.every(label => labels.includes(label)));
    return parity && (!ranges.length || ranges.some(profile => groupingCountsForRange(profile.range, parity).length > 0))
        ? parity : undefined;
}), {kind: 'alternatives', alternatives: parityAlternatives,
    contextLabels: groupingCountingRangeSchema[0], resolvedContext: true});

export const ParityGroupingGeneratorSchema = {
    ...countingQuantitySchema,
    range: groupingCountingRangeSchema,
    parity: [[...parityLabels, ...zeroLabels], resolveGroupingParity,
        parityAlternatives]
} as const;
export type ParityGroupingGeneratorConfig = ConfigFromSchema<typeof ParityGroupingGeneratorSchema>;
