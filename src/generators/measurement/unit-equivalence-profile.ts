import {Scope} from 'edugraph-ts';
import type {CanonicalNumericRange} from '../../lib/canonical-numeric-range.ts';
import {selectExactLabelSetMap} from '../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../types/schema.ts';
import {measurementConversionUnitPairSchema} from './conversion-schema.ts';
import {unitEquivalenceRanges, type UnitEquivalenceContract} from './unit-equivalence-domain.ts';

type RangeMappings = readonly (readonly [readonly string[], CanonicalNumericRange])[];

/** Correlate named-unit and range choices before either direct or planned generation. */
export function createUnitEquivalenceProfile(contract: UnitEquivalenceContract, mappings: RangeMappings) {
    const rangeChoices = mappings.map(([labels]) => [...labels]);
    const rangeLabels = [...new Set(rangeChoices.flat())];
    const pairLabels = measurementConversionUnitPairSchema[0], exactPair = measurementConversionUnitPairSchema[1];
    const contextLabels = [...pairLabels, ...rangeLabels];
    const exactRange = withLabelChoices(selectExactLabelSetMap(mappings),
        {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability'});
    const resolvePair = withLabelChoices(exactResolver((labels: string[]) => {
        const pair = exactPair(labels), upper = mappings.find(([bundle]) => labels.includes(bundle[0]!))?.[1].max;
        return pair && unitEquivalenceRanges(contract, pair).some(range =>
            (upper === undefined || range.max === upper) && (!labels.includes(Scope.NumbersLarger5) || range.min === 5)) ? pair : undefined;
    }), {...exactPair.labelChoices!, contextLabels: rangeLabels});
    const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
        const pair = exactPair(labels), range = exactRange(labels);
        if (!pair) return range;
        return range && unitEquivalenceRanges(contract, pair).some(candidate => candidate.min === range.min && candidate.max === range.max) ? range : undefined;
    }), {...exactRange.labelChoices!, contextLabels: pairLabels, resolvedContext: true});
    const permits = (selected: (label: string) => boolean): boolean => {
        const labels = contextLabels.filter(selected), pair = exactPair(labels), range = exactRange(labels);
        return !!pair && !!range && unitEquivalenceRanges(contract, pair).some(candidate => candidate.min === range.min && candidate.max === range.max);
    };
    return {resolvePair, resolveRange, rangeLabels, rangeChoices, contextLabels, permits};
}
