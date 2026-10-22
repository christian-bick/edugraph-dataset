import {Ability, Area} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

const variableRoles = [Area.UnknownVariable, Area.GeneralizedVariable] as const;

export const spec: ViewSpec = {
    viewId: 'algebra-variable-interpretation',
    generalLabels: [Ability.Interpretation],
    compatibility: [{
        id: 'explicit-variable-meaning-task',
        dependencies: variableRoles.map(label => ({scope: 'target' as const, label})),
        predicate: labels => variableRoles.some(label => labels.has('target', label))
    }]
};
export const AlgebraVariableInterpretationViewSchema = {} as const;
export type AlgebraVariableInterpretationViewConfig = ConfigFromSchema<typeof AlgebraVariableInterpretationViewSchema>;
