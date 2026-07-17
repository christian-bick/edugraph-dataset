import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'operations-vertical',
    supportedLabels: [
        Area.BaseOperations,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ]
};

export const OperationsVerticalGeneralLabels = [
    Area.BaseOperations,
    Scope.ArabicNumerals,
    Scope.NumericRange,
    Scope.NumbersWithZero,
    Ability.ProcedureExecution
];

export const OperationsVerticalViewSchema = {
    // TODO: add ontological relations where beneficial
} as const;

export type OperationsVerticalViewConfig = ConfigFromSchema<typeof OperationsVerticalViewSchema>;
