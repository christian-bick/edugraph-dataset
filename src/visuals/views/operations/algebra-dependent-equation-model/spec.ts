import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

const originBundle = [Area.AlgebraicModeling, Area.IndependentVariable, Area.DependentVariable] as const;
export const spec: ViewSpec = {
    viewId: 'algebra-dependent-equation-model',
    generalLabels: [Scope.ArabicNumerals, Ability.TextualReception, Ability.Formalization],
    compatibility: [requireTargetLabels('dependent-equation-model-task', [Area.AlgebraicModeling]), {
        id: 'dependent-equation-model-origin-evidence',
        dependencies: originBundle.map(label => ({scope: 'generator' as const, label})),
        predicate: labels => originBundle.every(label => labels.has('generator', label))
    }]
};
export const AlgebraDependentEquationModelViewSchema = {} as const;
export type AlgebraDependentEquationModelViewConfig = ConfigFromSchema<typeof AlgebraDependentEquationModelViewSchema>;
