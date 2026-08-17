import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-multiplication-area-model',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ]
};

export const OperationsMultiplicationAreaModelViewSchema = {} as const;

export type OperationsMultiplicationAreaModelViewConfig = ConfigFromSchema<
    typeof OperationsMultiplicationAreaModelViewSchema
>;
