import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {canonicalRangeProfiles, resolveCanonicalRangeFromLabels} from '../../../lib/canonical-range-labels.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema, exactResolver, withLabelChoices} from '../../../types/schema.ts';
import {generatorLabelRule} from '../../compatibility-rules.ts';
import {operationTableRows} from './domain.ts';

const operations = [Area.Addition, Area.Multiplication];
const operationValue = selectExactLabelMap([[Area.Addition, 'addition'], [Area.Multiplication, 'multiplication']] as const);
const profiles = canonicalRangeProfiles.filter(({range}) => range.min === 0 && [10, 20, 100].includes(range.max));
const choices = profiles.map(({labels}) => labels), rangeLabels = [...new Set(choices.flat())];
const resolveOperation = withLabelChoices(exactResolver((labels: string[]) => {
    const operation = operationValue(labels), requested = rangeLabels.filter(label => labels.includes(label));
    return operation && profiles.some(profile => requested.every(label => profile.labels.includes(label))
        && operationTableRows(operation, profile.range).length > 0) ? operation : undefined;
}), {...operationValue.labelChoices!, contextLabels: rangeLabels});
const permitsRange = (labels: string[]) => {
    const range = resolveCanonicalRangeFromLabels(labels), operation = operationValue(labels);
    return range !== undefined && (!operation || operationTableRows(operation, range).length > 0);
};
const resolveRange = withLabelChoices(exactResolver((labels: string[]) => permitsRange(labels)
    ? resolveCanonicalRangeFromLabels(labels) : undefined),
{kind: 'alternatives', alternatives: choices, contextLabels: operations, resolvedContext: true});

export const spec: GeneratorSpec = {
    generatorId: 'arithmetic-operation-table',
    compatibility: [generatorLabelRule('operation-row-canonical-range', [...operations, ...rangeLabels], selected =>
        permitsRange([...operations, ...rangeLabels].filter(selected)))],
    generalLabels: [Scope.IntegerNumbers, Scope.Base10, Scope.NumbersWithoutNegatives, Scope.NumbersWithZero]
};

export const ArithmeticOperationTableGeneratorSchema = {
    operation: [operations, resolveOperation, operations.map(label => [label])],
    range: [rangeLabels, resolveRange, choices]
} as const;

export type ArithmeticOperationTableGeneratorConfig = ConfigFromSchema<
    typeof ArithmeticOperationTableGeneratorSchema
>;
