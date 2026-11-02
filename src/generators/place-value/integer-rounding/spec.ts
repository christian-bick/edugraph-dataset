import {Area, Scope} from 'edugraph-ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {roundingPlaces} from './endpoint-profile.ts';
import {roundingDomain} from './domain.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';

const places = roundingPlaces.map(([label]) => label);
const zeros = [Scope.NumbersWithZero, Scope.NumbersWithoutZero];
const contextLabels = [...places, ...zeros];
const profiles = canonicalRangeProfiles.filter(({range}) => roundingPlaces.some(([, place]) =>
    [true, false].some(zero => roundingDomain(place, zero, range).count > 0)));
const rangeChoices = profiles.map(({labels}) => labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
const feasible = profiles.flatMap(profile => roundingPlaces.flatMap(([label, place]) => zeros.flatMap((zeroLabel, index) =>
    roundingDomain(place, index === 0, profile.range).count > 0 ? [{labels: [...profile.labels, label, zeroLabel]}] : [])));
const admits = (labels: string[]) => feasible.some(profile => [...contextLabels, ...rangeLabels]
    .filter(label => labels.includes(label)).every(label => profile.labels.includes(label)));
const resolvePlace = withLabelChoices(exactResolver((labels: string[]) => {
    const selected = places.filter(label => labels.includes(label));
    return selected.length === 1 && admits(labels) ? selected[0] : undefined;
}), {kind: 'alternatives', alternatives: places.map(label => [label]), contextLabels: [...rangeLabels, ...zeros]});
const resolveZero = withLabelChoices(exactResolver((labels: string[]) => {
    const selected = zeros.filter(label => labels.includes(label));
    return selected.length === 1 && admits(labels) ? selected[0] === Scope.NumbersWithZero : undefined;
}), {kind: 'alternatives', alternatives: zeros.map(label => [label]), contextLabels: [...places, ...rangeLabels], resolvedContext: true});
const permitsRange = (labels: string[]): boolean => {
    if (!contextLabels.some(label => labels.includes(label))) return true;
    const selectedPlaces = roundingPlaces.filter(([label]) => labels.includes(label));
    const selectedZeros = zeros.filter(label => labels.includes(label));
    const range = resolveCanonicalRangeFromLabels(labels);
    return selectedPlaces.length === 1 && selectedZeros.length === 1 && range !== undefined
        && roundingDomain(selectedPlaces[0]![1], selectedZeros[0] === Scope.NumbersWithZero, range).count > 0;
};
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range && permitsRange(labels) ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: rangeChoices, contextLabels, resolvedContext: true});

export const spec: GeneratorSpec<typeof IntegerRoundingGeneratorSchema> = {
    generatorId: 'integer-rounding',
    compatibility: [generatorLabelRule('rounding-canonical-endpoint-distance', [...contextLabels, ...rangeLabels], selected => {
        const labels = [...contextLabels, ...rangeLabels].filter(selected);
        return resolveCanonicalRangeFromLabels(labels) !== undefined && permitsRange(labels);
    })],
    generalLabels: [Area.IntegerRounding, Scope.IntegerNumbers, Scope.Base10, Scope.NumbersWithoutNegatives]
};

export const IntegerRoundingGeneratorSchema = {
    roundingMagnitude: [places, resolvePlace, places.map(label => [label])],
    zeroEndpoint: [zeros, resolveZero, zeros.map(label => [label])],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;

export type IntegerRoundingGeneratorConfig = ConfigFromSchema<typeof IntegerRoundingGeneratorSchema>;
