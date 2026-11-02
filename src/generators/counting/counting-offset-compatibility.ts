import {Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../lib/resolvers.ts';
import {exactResolver, withLabelChoices} from '../../types/schema.ts';
import {generatorLabelRule} from '../compatibility-rules.ts';
import {arithmeticOffsetDirection, arithmeticOffsetOperandProfile, hundredOffsetOperandProfile} from './arithmetic-offset-schema.ts';
import {placeValueOffsetRangeProfiles, placeValueOffsetStarts} from './place-value-offset-domain.ts';

const zeroLabels = [Scope.NumbersWithZero, Scope.NumbersWithoutZero] as const;
const resolveZero = selectExactLabelMap([[Scope.NumbersWithZero, true], [Scope.NumbersWithoutZero, false]] as const);
const directionLabels = arithmeticOffsetDirection[0];
const profileLabels = arithmeticOffsetOperandProfile[0];

/** The same feasibility proof constrains direct resolution and planned assignments. */
export function permitsPlaceValueOffset(step: 10 | 100, labels: string[]): boolean {
    const profiles = placeValueOffsetRangeProfiles(step);
    const upperLabels = profiles.flatMap(profile => profile.labels);
    const requested = labels.filter(label => upperLabels.includes(label));
    const ranges = requested.length ? profiles.filter(profile => profile.labels.every(label => requested.includes(label))) : profiles;
    if (requested.length > 1) return false;
    if (directionLabels.every(label => labels.includes(label))) return false;
    const direction = arithmeticOffsetDirection[1](labels);
    const operandProfile = (step === 10 ? arithmeticOffsetOperandProfile : hundredOffsetOperandProfile)[1](labels);
    if (operandProfile === undefined) return false;
    if (zeroLabels.every(label => labels.includes(label))) return false;
    const zero = resolveZero(labels);
    return ranges.some(({range}) => (direction ? [direction] : ['inc', 'dec'] as const).some(direction =>
        (zero === undefined ? [false, true] : [zero]).some(requireZero =>
            placeValueOffsetStarts(step, range, direction, operandProfile, requireZero).length > 0)));
}
export function placeValueOffsetSchema<T extends typeof arithmeticOffsetOperandProfile | typeof hundredOffsetOperandProfile>(
    step: 10 | 100, operandProfile: T
) {
    const profiles = placeValueOffsetRangeProfiles(step), rangeChoices = profiles.map(profile => profile.labels);
    const rangeLabels = [...new Set(rangeChoices.flat())];
    const context = [...directionLabels, ...profileLabels, ...zeroLabels, ...rangeLabels];
    const baseRange = selectExactLabelMap(profiles.map(profile => [profile.labels[0]!, profile.range] as const));
    const direction = withLabelChoices(exactResolver((labels: string[]) =>
        permitsPlaceValueOffset(step, labels) ? arithmeticOffsetDirection[1](labels) : undefined),
    {kind: 'alternatives', alternatives: directionLabels.map(label => [label]),
        contextLabels: context.filter(label => !directionLabels.includes(label as never)), resolvedContext: true});
    const requireZero = withLabelChoices(exactResolver((labels: string[]) =>
        permitsPlaceValueOffset(step, labels) ? resolveZero(labels) : undefined),
    {kind: 'alternatives', alternatives: zeroLabels.map(label => [label]),
        contextLabels: context.filter(label => !zeroLabels.includes(label as never)), resolvedContext: true});
    const range = withLabelChoices(exactResolver((labels: string[]) =>
        permitsPlaceValueOffset(step, labels) ? baseRange(labels) : undefined),
    {kind: 'alternatives', relation: 'capability', alternatives: rangeChoices,
        contextLabels: context.filter(label => !rangeLabels.includes(label)), resolvedContext: true});
    return {
        direction: [directionLabels, direction, directionLabels.map(label => [label])],
        operandProfile,
        requireZero: [zeroLabels, requireZero, zeroLabels.map(label => [label])],
        range: [rangeLabels, range, rangeChoices]
    } as const;
}
export function placeValueOffsetRule(step: 10 | 100) {
    const labels = [...directionLabels, ...profileLabels, ...zeroLabels,
        ...placeValueOffsetRangeProfiles(step).flatMap(profile => profile.labels)];
    return generatorLabelRule(`offset-${step}-canonical-domain`, labels,
        selected => permitsPlaceValueOffset(step, labels.filter(selected)));
}
