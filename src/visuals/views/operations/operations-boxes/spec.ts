import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'operations-boxes',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};


export const OperationsBoxesViewSchema = {} as const;

export type OperationsBoxesViewConfig = ConfigFromSchema<typeof OperationsBoxesViewSchema>;
