import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'algebra-equation-model-solve',
    generalLabels: [Scope.ArabicNumerals, Ability.TextualReception, Ability.Formalization, Ability.ProcedureExecution],
    compatibility: [
        requireTargetLabels('algebra-equation-model-solve-task', [Area.AlgebraicModeling, Area.Equation, Area.EquationSolving]),
        {
            id: 'algebra-equation-model-solve-evidence',
            description: 'Admit the mathematical relation bundle whose complete claims survive this fixed projection.',
            dependencies: [Area.AlgebraicModeling, Area.EquationSolving, Area.SolutionSet, Area.AlgebraicSubstitution, Area.RelationSatisfaction].map(label => ({scope: 'generator' as const, label})),
            predicate: labels => labels.has('generator', Area.AlgebraicModeling) && labels.has('generator', Area.EquationSolving) && [Area.SolutionSet, Area.AlgebraicSubstitution, Area.RelationSatisfaction].every(label => !labels.has('generator', label))
        }
    ]
};
export const AlgebraEquationModelSolveViewSchema = {} as const;
export type AlgebraEquationModelSolveViewConfig = ConfigFromSchema<typeof AlgebraEquationModelSolveViewSchema>;

