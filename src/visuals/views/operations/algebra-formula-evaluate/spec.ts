import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'algebra-formula-evaluate',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureExecution, Ability.TextualReception],
    compatibility: [
        requireTargetLabels('algebra-contextual-substitution-task', [Ability.TextualReception, Area.AlgebraicSubstitution, Area.OrderOfOperations])
    ]
};
export const AlgebraFormulaEvaluateViewSchema = {} as const;
export type AlgebraFormulaEvaluateViewConfig = ConfigFromSchema<typeof AlgebraFormulaEvaluateViewSchema>;
