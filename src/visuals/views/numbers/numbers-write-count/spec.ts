import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-count',
    generalLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution,
        Scope.ArabicNumerals
    ],
    rejectedLabels: [Area.DigitNotation],
};


export const NumbersWriteCountViewSchema = {
} as const;

export type NumbersWriteCountViewConfig = ConfigFromSchema<typeof NumbersWriteCountViewSchema>;
