import {Ability, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-number-line',
    generalLabels: [Scope.Numberline],
    rejectedLabels: [
        Scope.NumbersWithoutZero,
        ...deductAdmitting([Scope.NumbersWithNegatives]),
        ...deductAdmitting([Scope.NumbersLarger100])
    ]
};

export const OperationsNumberLineViewSchema = {
    responseMode: [Ability.VisualArticulation, Ability.ProcedureExecution]
} as const;

export type OperationsNumberLineViewConfig = ConfigFromSchema<typeof OperationsNumberLineViewSchema>;
