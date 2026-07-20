import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-count',
    supportedLabels: [
        Area.Numeration,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ],
};


export const NumbersWriteCountViewSchema = {
    // TODO: add ontological relations where beneficial
} as const;

export type NumbersWriteCountViewConfig = ConfigFromSchema<typeof NumbersWriteCountViewSchema>;
