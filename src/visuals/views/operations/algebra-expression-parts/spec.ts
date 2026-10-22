import {Ability, Area, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

const structuralRoles = [Area.Term, Area.Factor, Area.Coefficient, Area.Addition, Area.Multiplication, Area.Division] as const;

export const spec: ViewSpec = {
    viewId: 'algebra-expression-parts',
    generalLabels: [Scope.ArabicNumerals, Ability.ConceptClassification],
    compatibility: [
        {
            id: 'algebra-expression-structural-task',
            dependencies: structuralRoles.map(label => ({scope: 'target' as const, label})),
            predicate: labels => structuralRoles.some(label => labels.has('target', label))
        }
    ]
};
export const AlgebraExpressionPartsViewSchema = {} as const;
export type AlgebraExpressionPartsViewConfig = ConfigFromSchema<typeof AlgebraExpressionPartsViewSchema>;
