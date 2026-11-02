import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {arithmeticOperations, operationNames} from '../helpers.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {hasCanonicalEstimationProfile} from './canonical-domain.ts';

const zeros = [Scope.NumbersWithZero, Scope.NumbersWithoutZero];
const contextLabels = [...arithmeticOperations, ...zeros];
const profiles = canonicalRangeProfiles.filter(({range}) => range.max <= 1000
    && arithmeticOperations.some(operation => [false, true].some(zero => hasCanonicalEstimationProfile(operationNames[operation], zero, range))));
const rangeChoices = profiles.map(({labels}) => labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
const feasible = profiles.flatMap(profile => arithmeticOperations.flatMap(operation => zeros.flatMap((zeroLabel, index) =>
    hasCanonicalEstimationProfile(operationNames[operation], index === 0, profile.range)
        ? [{labels: [...profile.labels, operation, zeroLabel]}] : [])));
const admits = (labels: string[]) => feasible.some(profile => [...contextLabels, ...rangeLabels]
    .filter(label => labels.includes(label)).every(label => profile.labels.includes(label)));
const resolveOperation = withLabelChoices(exactResolver((labels: string[]) => {
    const selected = arithmeticOperations.filter(label => labels.includes(label));
    return selected.length === 1 && admits(labels) ? selected[0] : undefined;
}), {kind: 'alternatives', alternatives: arithmeticOperations.map(label => [label]), contextLabels: [...zeros, ...rangeLabels]});
const resolveZero = withLabelChoices(exactResolver((labels: string[]) => {
    const selected = zeros.filter(label => labels.includes(label));
    return selected.length === 1 && admits(labels) ? selected[0] === Scope.NumbersWithZero : undefined;
}), {kind: 'alternatives', alternatives: zeros.map(label => [label]), contextLabels: [...arithmeticOperations, ...rangeLabels], resolvedContext: true});
const permitsRange = (labels: string[]): boolean => {
    if (!contextLabels.some(label => labels.includes(label))) return true;
    const selectedOperations = arithmeticOperations.filter(label => labels.includes(label));
    const selectedZeros = zeros.filter(label => labels.includes(label));
    const range = resolveCanonicalRangeFromLabels(labels);
    return selectedOperations.length === 1 && selectedZeros.length === 1 && range !== undefined
        && hasCanonicalEstimationProfile(operationNames[selectedOperations[0]!], selectedZeros[0] === Scope.NumbersWithZero, range);
};
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range && permitsRange(labels) ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: rangeChoices, contextLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-estimation',
    compatibility: [generatorLabelRule('estimation-canonical-domain', [...contextLabels, ...rangeLabels], selected => {
        const labels = [...contextLabels, ...rangeLabels].filter(selected);
        return resolveCanonicalRangeFromLabels(labels) !== undefined && permitsRange(labels);
    })],
    generalLabels: [Area.IntegerRounding, Scope.IntegerNumbers, Scope.Base10, Scope.NumbersWithoutNegatives]
};

export const ArithmeticEstimationGeneratorSchema = {
    operation: [arithmeticOperations, resolveOperation, arithmeticOperations.map(label => [label])],
    zeroPresence: [zeros, resolveZero, zeros.map(label => [label])],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;

export type ArithmeticEstimationGeneratorConfig = ConfigFromSchema<typeof ArithmeticEstimationGeneratorSchema>;
