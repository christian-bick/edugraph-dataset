import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'algebra-inequality-numberline',
    generalLabels: [Scope.Numberline, Scope.GraphicalAlgebraicRepresentation, Ability.VisualArticulation],
    compatibility: [
        requireTargetLabels('algebra-inequality-numberline-task', [Area.Inequality, Area.SolutionSet, Scope.Numberline]),
        {
            id: 'algebra-inequality-numberline-evidence',
            description: 'Admit the mathematical relation bundle whose complete claims survive this fixed projection.',
            dependencies: [Area.SolutionSet, Area.AlgebraicModeling, Area.InequalitySolving, Area.AlgebraicSubstitution, Area.RelationSatisfaction].map(label => ({scope: 'generator' as const, label})),
            predicate: labels => labels.has('generator', Area.SolutionSet) && [Area.AlgebraicModeling, Area.InequalitySolving, Area.AlgebraicSubstitution, Area.RelationSatisfaction].every(label => !labels.has('generator', label))
        }
    ]
};
export const AlgebraInequalityNumberlineViewSchema = {} as const;
export type AlgebraInequalityNumberlineViewConfig = ConfigFromSchema<typeof AlgebraInequalityNumberlineViewSchema>;

