import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {operationNames, resolveTwoStepOperations} from '../helpers.ts';
import {twoStepGeneralLabels, twoStepOperationCompatibility, twoStepOperationLabels,
    TwoStepExtendedGeneratorSchema} from '../two-step-capabilities.ts';
import {twoStepDomain} from './domain.ts';

const operationContexts = twoStepOperationLabels.flatMap((first, index) =>
    [ [first], ...twoStepOperationLabels.slice(index + 1).map(second => [first, second]) ]);
const permitsRange = (labels: string[], range: Parameters<typeof twoStepDomain>[1]): boolean => {
    const count = twoStepOperationLabels.filter(label => labels.includes(label)).length;
    if (!count) return true;
    if (count > 2) return false;
    const operations = resolveTwoStepOperations(labels);
    return operations !== 'unsupported' && twoStepDomain([operationNames[operations[0]], operationNames[operations[1]]], range).count > 0;
};
const profiles = canonicalRangeProfiles.filter(({range}) => range.max <= 100 && [0, 5, 10, 20].includes(range.min)
    && operationContexts.some(context => permitsRange(context, range)));
const rangeChoices = profiles.map(({labels}) => labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range && permitsRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: rangeChoices,
    contextLabels: twoStepOperationLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problems-two-step',
    compatibility: [...twoStepOperationCompatibility,
        generatorLabelRule('two-step-canonical-band', [...twoStepOperationLabels, ...rangeLabels], selected => {
            const labels = [...twoStepOperationLabels, ...rangeLabels].filter(selected);
            const range = resolveCanonicalRangeFromLabels(labels);
            return range !== undefined && permitsRange(labels, range);
        })],
    generalLabels: twoStepGeneralLabels
};

export const ArithmeticWordProblemsTwoStepGeneratorSchema = {
    operations: TwoStepExtendedGeneratorSchema.operations,
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;

export type ArithmeticWordProblemsTwoStepGeneratorConfig = ConfigFromSchema<typeof ArithmeticWordProblemsTwoStepGeneratorSchema>;
