import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {hasLabel, selectExactLabelMap} from '../../../lib/resolvers.ts';
import {sequenceFramesForRange, sequenceRangeProfiles} from './numeric-domain.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const sequenceSteps = [[Scope.StepsOf1, 1], [Scope.StepsOf5, 5],
    [Scope.StepsOf10, 10], [Scope.StepsOf100, 100]] as const;
const stepLabels = sequenceSteps.map(([label]) => label);
const contextLabels = [...stepLabels, Scope.MultiplesOf10];
const rangeChoices = sequenceRangeProfiles.map(profile => profile.labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
const resolveStep = selectExactLabelMap(sequenceSteps);
const permitsRange = (labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    if (!range) return false;
    if (!contextLabels.some(label => labels.includes(label))) return true;
    const step = resolveStep(labels);
    return step !== undefined && sequenceFramesForRange(step, labels.includes(Scope.MultiplesOf10), range).length > 0;
};
const resolveRange = withLabelChoices(exactResolver((labels: string[]) =>
    permitsRange(labels) ? resolveCanonicalRangeFromLabels(labels) : undefined),
{kind: 'alternatives', relation: 'capability', alternatives: rangeChoices, contextLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'counting-sequence',
    compatibility: [generatorLabelRule('multiple-ten-step', [
        Scope.MultiplesOf10, Scope.StepsOf10
    ], selected => !selected(Scope.MultiplesOf10) || selected(Scope.StepsOf10)),
        generatorLabelRule('sequence-canonical-range', [...contextLabels, ...rangeLabels], selected =>
            permitsRange([...contextLabels, ...rangeLabels].filter(selected)))],
    generalLabels: [
        Area.NumerationWithIntegers,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutZero,
        Scope.NumbersWithoutNegatives,
        Scope.After
    ]
};

export const CountingSequenceGeneratorSchema = {
    stepMagnitude: stepLabels,
    requireMultipleOf10: [[Scope.MultiplesOf10], hasLabel(Scope.MultiplesOf10)],
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;

export type CountingSequenceGeneratorConfig = ConfigFromSchema<typeof CountingSequenceGeneratorSchema>;
