import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-stroke',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ],
};


export const NumbersWriteStrokeViewSchema = {
    // TODO: add ontological relations where beneficial
} as const;

export type NumbersWriteStrokeViewConfig = ConfigFromSchema<typeof NumbersWriteStrokeViewSchema>;
