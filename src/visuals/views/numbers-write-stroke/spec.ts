import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-stroke',
    supportedLabels: [
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ],
};

export const NumbersWriteStrokeGeneralLabels = [
    Area.DigitNotation,
    Scope.ArabicNumerals,
    Scope.NumericRange,
    Scope.NumbersWithZero,
    Ability.ProcedureExecution
];

export const NumbersWriteStrokeViewSchema = {
    // TODO: add ontological relations where beneficial
} as const;

export type NumbersWriteStrokeViewConfig = ConfigFromSchema<typeof NumbersWriteStrokeViewSchema>;
