import {Area} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {TwoStepExtendedGeneratorSchema, twoStepGeneralLabels, twoStepOperationCompatibility} from '../two-step-capabilities.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {roundingDomain, roundingOperationProfiles, roundingOperationsForLabels, roundingRangeForLabels,
    roundingRangeLabels, roundingRangeProfiles} from './domain.ts';

const operationLabels = [...new Set(roundingOperationProfiles.flatMap(p => [...p.labels]))];
const choices = roundingRangeProfiles.map(p => p.labels);
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => {
    const range = roundingRangeForLabels(labels), operations = roundingOperationsForLabels(labels);
    return range && (!operations || roundingDomain(operations, range).weight > 0) ? range : undefined;
}), {kind: 'alternatives', relation: 'capability', alternatives: choices, contextLabels: operationLabels, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-word-problems-rounding',
    compatibility: [...twoStepOperationCompatibility, generatorLabelRule('rounding-story-canonical-domain', [...operationLabels, ...roundingRangeLabels], selected => {
        const labels = [...operationLabels, ...roundingRangeLabels].filter(selected);
        const operations = roundingOperationsForLabels(labels), range = roundingRangeForLabels(labels);
        return !!operations && !!range && roundingDomain(operations, range).weight > 0;
    })],
    generalLabels: [...twoStepGeneralLabels, Area.IntegerRounding]
};

export const ArithmeticWordProblemsRoundingGeneratorSchema = {
    operations: TwoStepExtendedGeneratorSchema.operations,
    range: [roundingRangeLabels, resolveRange, choices]
} as const;
export type ArithmeticWordProblemsRoundingGeneratorConfig = ConfigFromSchema<typeof ArithmeticWordProblemsRoundingGeneratorSchema>;
