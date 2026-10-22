import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'algebra-solution-meaning',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureUnderstanding],
    compatibility: [
        requireTargetLabels('algebra-solution-meaning-task', [Area.SolutionSet]),
        {
            id: 'algebra-solution-meaning-evidence',
            description: 'Admit the mathematical relation bundle whose complete claims survive this fixed projection.',
            dependencies: [Area.SolutionSet, Area.AlgebraicModeling, Area.AlgebraicSubstitution, Area.RelationSatisfaction, Area.EquationSolving, Area.InequalitySolving].map(label => ({scope: 'generator' as const, label})),
            predicate: labels => labels.has('generator', Area.SolutionSet) && (labels.has('generator', Area.EquationSolving) || labels.has('generator', Area.InequalitySolving)) && [Area.AlgebraicModeling, Area.AlgebraicSubstitution, Area.RelationSatisfaction].every(label => !labels.has('generator', label))
        },
        {
            id: 'algebra-solution-meaning-solving-participation',
            description: 'The explanation concerns solving over a specified candidate universe.',
            dependencies: [Area.EquationSolving, Area.InequalitySolving].map(label => ({scope: 'target' as const, label})),
            predicate: labels => labels.has('target', Area.EquationSolving) || labels.has('target', Area.InequalitySolving)
        }
    ]
};
export const AlgebraSolutionMeaningViewSchema = {} as const;
export type AlgebraSolutionMeaningViewConfig = ConfigFromSchema<typeof AlgebraSolutionMeaningViewSchema>;

