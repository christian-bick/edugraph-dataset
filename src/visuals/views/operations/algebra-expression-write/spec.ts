import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

const writingExtras = [Area.ArithmeticExpression, Area.Term, Area.Factor, Area.Coefficient, Area.Addition, Area.Multiplication, Area.Division, Area.GroupingSymbol, Area.Operand, Area.AlgebraicSubstitution, Area.OrderOfOperations, Area.AlgebraicModeling, Area.Exponentiation, Scope.IntegerExponent, Scope.PositiveExponent] as const;

export const spec: ViewSpec = {
    viewId: 'algebra-expression-write',
    generalLabels: [Scope.ArabicNumerals, Ability.Formalization, Ability.TextualReception],
    compatibility: [
        requireTargetLabels('algebra-expression-writing-task', [Area.AlgebraicExpression, Ability.TextualReception]),
        {
            id: 'algebra-expression-writing-evidence',
            description: 'Operation prose preserves the plain letter expression while withholding written structural and calculation claims.',
            dependencies: writingExtras.map(label => ({scope: 'generator' as const, label})),
            predicate: labels => writingExtras.every(label => !labels.exact('generator', label))
        }
    ]
};
export const AlgebraExpressionWriteViewSchema = {} as const;
export type AlgebraExpressionWriteViewConfig = ConfigFromSchema<typeof AlgebraExpressionWriteViewSchema>;
