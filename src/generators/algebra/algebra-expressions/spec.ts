import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const relations = [
    [[Area.AlgebraicExpression], 'plain'],
    [[Area.ArithmeticExpression, Area.Term], 'numeric-terms'],
    [[Area.AlgebraicExpression, Area.Term], 'symbolic-terms'],
    [[Area.ArithmeticExpression, Area.Factor], 'numeric-factors'],
    [[Area.AlgebraicExpression, Area.Factor], 'symbolic-factors'],
    [[Area.AlgebraicExpression, Area.Coefficient], 'symbolic-coefficient'],
    [[Area.ArithmeticExpression, Area.Addition], 'numeric-sum'],
    [[Area.AlgebraicExpression, Area.Addition], 'symbolic-sum'],
    [[Area.ArithmeticExpression, Area.Multiplication], 'numeric-product'],
    [[Area.AlgebraicExpression, Area.Multiplication], 'symbolic-product'],
    [[Area.ArithmeticExpression, Area.Division], 'numeric-quotient'],
    [[Area.AlgebraicExpression, Area.Division], 'symbolic-quotient'],
    [[Area.ArithmeticExpression, Area.GroupingSymbol, Area.Operand], 'numeric-grouped'],
    [[Area.AlgebraicExpression, Area.GroupingSymbol, Area.Operand], 'symbolic-grouped'],
    [[Area.AlgebraicExpression, Area.AlgebraicSubstitution, Area.OrderOfOperations], 'substitution'],
    [[Area.AlgebraicExpression, Area.AlgebraicModeling], 'modeling']
] as const;
const powers = [[[], 'none'], [[Area.Exponentiation, Scope.IntegerExponent], 'allow-zero'],
    [[Area.Exponentiation, Scope.IntegerExponent, Scope.PositiveExponent], 'positive']] as const;

export const spec: GeneratorSpec = {
    generatorId: 'algebra-expressions',
    generalLabels: [],
    compatibility: [{
        id: 'algebra-power-substitution',
        description: 'Powered calculations belong to the substitution and precedence relation.',
        dependencies: [{scope: 'generator', label: Area.Exponentiation}, {scope: 'generator', label: Area.AlgebraicSubstitution}],
        predicate: labels => !labels.has('generator', Area.Exponentiation) || labels.has('generator', Area.AlgebraicSubstitution)
    }]
};

export const AlgebraExpressionsGeneratorSchema = {
    relation: [[...new Set(relations.flatMap(([labels]) => labels))], selectExactLabelSetMap(relations), relations.map(([labels]) => labels)],
    power: [[Area.Exponentiation, Scope.IntegerExponent, Scope.PositiveExponent], selectExactLabelSetMap(powers), powers.map(([labels]) => labels)]
} as const;
export type AlgebraExpressionsGeneratorConfig = ConfigFromSchema<typeof AlgebraExpressionsGeneratorSchema>;
