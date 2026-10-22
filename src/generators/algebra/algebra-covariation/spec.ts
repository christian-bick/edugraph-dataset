import {Area} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const relations = [
    [[Area.AlgebraicModeling, Area.IndependentVariable, Area.DependentVariable], 'quantitative-origin'],
    [[Area.IndependentVariable, Area.DependentVariable], 'designated-dependency'],
    [[], 'numerical-correspondence']
] as const;

export const spec: GeneratorSpec = {generatorId: 'algebra-covariation', generalLabels: [Area.NumericFunction, Area.Equation]};
export const AlgebraCovariationGeneratorSchema = {
    relations: [[Area.AlgebraicModeling, Area.IndependentVariable, Area.DependentVariable], selectExactLabelSetMap(relations), relations.map(([labels]) => labels)]
} as const;
export type AlgebraCovariationGeneratorConfig = ConfigFromSchema<typeof AlgebraCovariationGeneratorSchema>;
