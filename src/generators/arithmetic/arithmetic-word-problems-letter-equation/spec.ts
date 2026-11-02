import {Area} from 'edugraph-ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {TwoStepExtendedGeneratorSchema, twoStepGeneralLabels, twoStepOperationCompatibility, twoStepOperationLabels} from '../two-step-capabilities.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {operationNames, resolveTwoStepOperations} from '../helpers.ts';
import {letterEquationDomain} from './domain.ts';

const operationContexts = twoStepOperationLabels.flatMap((first, index) =>
    [[first], ...twoStepOperationLabels.slice(index + 1).map(second => [first, second])]);
const permitsRange = (labels: string[], range: Parameters<typeof letterEquationDomain>[1]): boolean => {
    const count = twoStepOperationLabels.filter(label => labels.includes(label)).length;
    if (!count) return true;
    if (count > 2) return false;
    const operations = resolveTwoStepOperations(labels);
    return operations !== 'unsupported'
        && letterEquationDomain([operationNames[operations[0]], operationNames[operations[1]]], range).count > 0;
};
const profiles = canonicalRangeProfiles.filter(({range}) => [0, 5, 10, 20].includes(range.min)
    && operationContexts.some(context => permitsRange(context, range)));
const rangeChoices = profiles.map(({labels}) => labels);
const rangeLabels = [...new Set(rangeChoices.flat())];
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels);
    return range && permitsRange(labels, range) ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: rangeChoices,
    contextLabels: twoStepOperationLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problems-letter-equation',
    compatibility: [...twoStepOperationCompatibility,
        generatorLabelRule('letter-equation-canonical-band', [...twoStepOperationLabels, ...rangeLabels], selected => {
            const labels = [...twoStepOperationLabels, ...rangeLabels].filter(selected);
            return resolveCanonicalRangeFromLabels(labels) !== undefined && permitsRange(labels, resolveCanonicalRangeFromLabels(labels)!);
        })],
    generalLabels: [...twoStepGeneralLabels, Area.Equation]
};

export const ArithmeticWordProblemsLetterEquationGeneratorSchema = {
    operations: TwoStepExtendedGeneratorSchema.operations,
    range: [rangeLabels, resolveRange, rangeChoices]
} as const;
export type ArithmeticWordProblemsLetterEquationGeneratorConfig = ConfigFromSchema<typeof ArithmeticWordProblemsLetterEquationGeneratorSchema>;
