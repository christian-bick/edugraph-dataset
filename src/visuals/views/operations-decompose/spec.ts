import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'operations-decompose',
    generalLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ]
};


export const OperationsDecomposeViewSchema = {
    // TODO: add ontological relations where beneficial
} as const;

export type OperationsDecomposeViewConfig = ConfigFromSchema<typeof OperationsDecomposeViewSchema>;
