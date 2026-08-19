import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-representation',
    generalLabels: [
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ],
    rejectedLabels: [...deductAdmitting([Scope.NumbersLarger10])]
};

export const OperationsRepresentationViewSchema = {} as const;

export type OperationsRepresentationViewConfig = ConfigFromSchema<typeof OperationsRepresentationViewSchema>;
