import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {exactResolver, withLabelChoices, type ConfigFromSchema} from '../../../types/schema.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {massReadingRangeProfiles, massReadingsForRange} from './numeric-domain.ts';
import type {CanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';

const scaleLabels = [Scope.GramScale, Scope.KilogramScale];
const resolveMeasurement = selectExactLabelMap([
    [Scope.GramScale, 'gram-weight'], [Scope.KilogramScale, 'kilogram-weight']
]);
const rangeChoices = massReadingRangeProfiles.map(profile => profile.labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
function permitsRange(labels: string[], range: CanonicalNumericRange): boolean {
    const measurement = resolveMeasurement(labels);
    return measurement === undefined || massReadingsForRange(measurement, range).length > 0;
}
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range !== undefined && permitsRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', alternatives: rangeChoices, relation: 'capability',
    contextLabels: scaleLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'measurement-mass',
    generalLabels: [Area.MeasuringWeight, Scope.IntegerNumbers,
        Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero],
    compatibility: [generatorLabelRule('mass-canonical-range', [...scaleLabels, ...rangeLabels], selected => {
        const labels = [...scaleLabels, ...rangeLabels].filter(selected);
        const range = resolveCanonicalRangeFromLabels(labels);
        return range !== undefined && permitsRange(labels, range);
    })]
};

export const MeasurementMassGeneratorSchema = {
    measurement: [scaleLabels, resolveMeasurement],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;
export type MeasurementMassGeneratorConfig = ConfigFromSchema<typeof MeasurementMassGeneratorSchema>;
