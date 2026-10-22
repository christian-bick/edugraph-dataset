import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'algebra-substitution-check',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution, Ability.CorrectnessEvaluation],
    compatibility: [
        requireTargetLabels('algebra-substitution-check-task', [Area.AlgebraicSubstitution, Area.RelationSatisfaction]),
        {
            id: 'algebra-substitution-check-evidence',
            description: 'Admit the mathematical relation bundle whose complete claims survive this fixed projection.',
            dependencies: [Area.AlgebraicSubstitution, Area.RelationSatisfaction, Area.AlgebraicModeling, Area.SolutionSet, Area.EquationSolving, Area.InequalitySolving].map(label => ({scope: 'generator' as const, label})),
            predicate: labels => labels.has('generator', Area.AlgebraicSubstitution) && labels.has('generator', Area.RelationSatisfaction) && [Area.AlgebraicModeling, Area.SolutionSet, Area.EquationSolving, Area.InequalitySolving].every(label => !labels.has('generator', label))
        }
    ]
};
export const AlgebraSubstitutionCheckViewSchema = {} as const;
export type AlgebraSubstitutionCheckViewConfig = ConfigFromSchema<typeof AlgebraSubstitutionCheckViewSchema>;

