import {Area} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const relations = [
    [[Area.DistributingLinearCombinations], 'distribution'],
    [[Area.CollectingLinearTerms], 'collection'],
    [[Area.AlgebraicEquivalence, Area.AssociativeLaw], 'association'],
    [[Area.AlgebraicEquivalence, Area.CommutativeLaw], 'commutation'],
    [[Area.AlgebraicEquivalence], 'normalization']
] as const;

export const spec: GeneratorSpec = {generatorId: 'algebra-expression-equivalence', generalLabels: [Area.AlgebraicExpression]};
export const AlgebraExpressionEquivalenceGeneratorSchema = {
    relation: [[...new Set(relations.flatMap(([labels]) => labels))], selectExactLabelSetMap(relations), relations.map(([labels]) => labels)]
} as const;
export type AlgebraExpressionEquivalenceGeneratorConfig = ConfigFromSchema<typeof AlgebraExpressionEquivalenceGeneratorSchema>;
