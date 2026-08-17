import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-division-area-model',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ]
};

export const OperationsDivisionAreaModelViewSchema = {} as const;

export type OperationsDivisionAreaModelViewConfig = ConfigFromSchema<
    typeof OperationsDivisionAreaModelViewSchema
>;
