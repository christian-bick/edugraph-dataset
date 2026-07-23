import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'operations-vertical',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};


export const OperationsVerticalViewSchema = {
    // TODO: add ontological relations where beneficial
} as const;

export type OperationsVerticalViewConfig = ConfigFromSchema<typeof OperationsVerticalViewSchema>;
