import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const relations = [
    [[Area.AlgebraicSubstitution, Area.RelationSatisfaction], 'instantiated-predicate'],
    [[Area.SolutionSet, Area.InequalitySolving], 'finite-extension'],
    [[Area.SolutionSet], 'rational-half-line'],
    [[Area.AlgebraicModeling], 'quantitative-threshold']
] as const;
const directions = [[[Scope.Less], 'less'], [[Scope.Greater], 'greater']] as const;
export const spec: GeneratorSpec = {generatorId: 'algebra-inequalities', generalLabels: [Area.Inequality, Scope.NoExpressions]};
export const AlgebraInequalitiesGeneratorSchema = {
    relation: [[...new Set(relations.flatMap(([labels]) => labels))], selectExactLabelSetMap(relations), relations.map(([labels]) => labels)],
    direction: [[Scope.Less, Scope.Greater], selectExactLabelSetMap(directions), directions.map(([labels]) => labels)]
} as const;
export type AlgebraInequalitiesGeneratorConfig = ConfigFromSchema<typeof AlgebraInequalitiesGeneratorSchema>;
