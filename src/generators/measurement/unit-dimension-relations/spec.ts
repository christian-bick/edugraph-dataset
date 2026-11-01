import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {exactResolver, withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {dimensionRelationCaseCount, dimensionRelationRangeProfiles} from './numeric-domain.ts';

const operationLabels = [Area.Multiplication, Area.Division];
const resolveOperation = selectExactLabelMap([
    [Area.Multiplication, 'multiplication'], [Area.Division, 'division']
]);
const rangeChoices = dimensionRelationRangeProfiles.map(profile => profile.labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
function permitsRange(labels: string[], range: CanonicalNumericRange): boolean {
    const operation = resolveOperation(labels);
    return operation === undefined || dimensionRelationCaseCount(operation, range) > 0;
}
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range !== undefined && permitsRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability',
    contextLabels: operationLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'unit-dimension-relations',
    generalLabels: [Area.UnitDimensionality, Scope.RationalNumbers],
    compatibility: [generatorLabelRule('dimension-canonical-range', [...operationLabels, ...rangeLabels], selected => {
        const labels = [...operationLabels, ...rangeLabels].filter(selected);
        const range = resolveCanonicalRangeFromLabels(labels);
        return range !== undefined && permitsRange(labels, range);
    })]
};

export const UnitDimensionRelationsGeneratorSchema = {
    operation: [operationLabels, resolveOperation],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;
export type UnitDimensionRelationsGeneratorConfig = ConfigFromSchema<typeof UnitDimensionRelationsGeneratorSchema>;
