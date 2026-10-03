import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-decimal-multiplication-method',
    generalLabels: [
        Scope.ArabicNumerals,
        Scope.VisualNumbers,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ]
};

export const OperationsDecimalMultiplicationMethodViewSchema = {} as const;
export type OperationsDecimalMultiplicationMethodViewConfig = ConfigFromSchema<
    typeof OperationsDecimalMultiplicationMethodViewSchema
>;
