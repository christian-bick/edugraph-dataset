import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'operations-decompose',
    generalLabels: [
        Scope.PhysicalNumbers,
        Scope.NumbersWithZero,
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding
    ]
};


export const OperationsDecomposeViewSchema = {
    // TODO: add ontological relations where beneficial
} as const;

export type OperationsDecomposeViewConfig = ConfigFromSchema<typeof OperationsDecomposeViewSchema>;
