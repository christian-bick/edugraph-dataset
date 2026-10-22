import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const relations = [
    [[Area.AlgebraicSubstitution, Area.RelationSatisfaction], 'instantiated-predicate'],
    [[Area.SolutionSet, Area.EquationSolving], 'finite-extension'],
    [[Area.AlgebraicModeling, Area.EquationSolving, Area.Addition, Scope.NumbersWithoutNegatives], 'nonnegative-sum-preimage'],
    [[Area.AlgebraicModeling, Area.EquationSolving, Area.Multiplication, Scope.NumbersWithoutNegatives], 'nonnegative-product-preimage']
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'algebra-equations', generalLabels: [Area.Equation, Scope.ExpressionOnOneSide, Scope.RationalNumbers]
};
export const AlgebraEquationsGeneratorSchema = {
    relation: [[...new Set(relations.flatMap<string>(([labels]) => labels))], selectExactLabelSetMap(relations), relations.map(([labels]) => labels)]
} as const;
export type AlgebraEquationsGeneratorConfig = ConfigFromSchema<typeof AlgebraEquationsGeneratorSchema>;
