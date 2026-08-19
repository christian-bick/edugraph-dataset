import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-vertical-inversion',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution,
        Ability.ProcedureInversion
    ]
};

export const OperationsVerticalInversionViewSchema = {} as const;
export type OperationsVerticalInversionViewConfig = ConfigFromSchema<
    typeof OperationsVerticalInversionViewSchema
>;
