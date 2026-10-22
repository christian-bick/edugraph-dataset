import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'algebra-inequality-model',
    generalLabels: [Scope.ArabicNumerals, Ability.TextualReception, Ability.Formalization],
    compatibility: [
        requireTargetLabels('algebra-inequality-model-task', [Area.AlgebraicModeling, Area.Inequality]),
        {
            id: 'algebra-inequality-model-evidence',
            description: 'Admit the mathematical relation bundle whose complete claims survive this fixed projection.',
            dependencies: [Area.AlgebraicModeling, Area.SolutionSet, Area.InequalitySolving, Area.AlgebraicSubstitution, Area.RelationSatisfaction].map(label => ({scope: 'generator' as const, label})),
            predicate: labels => labels.has('generator', Area.AlgebraicModeling) && [Area.SolutionSet, Area.InequalitySolving, Area.AlgebraicSubstitution, Area.RelationSatisfaction].every(label => !labels.has('generator', label))
        }
    ]
};
export const AlgebraInequalityModelViewSchema = {} as const;
export type AlgebraInequalityModelViewConfig = ConfigFromSchema<typeof AlgebraInequalityModelViewSchema>;

