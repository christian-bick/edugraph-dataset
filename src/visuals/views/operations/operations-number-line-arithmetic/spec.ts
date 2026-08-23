import {Ability, Area, deductAdmitting, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-number-line-arithmetic',
    generalLabels: [Scope.Numberline, Ability.ProcedureExecution],
    rejectedLabels: [
        Area.Multiplication,
        Area.Division,
        Scope.NumbersWithoutZero,
        ...deductAdmitting([Scope.NumbersWithNegatives]),
        ...deductAdmitting([Scope.NumbersLarger100])
    ]
};

export const OperationsNumberLineArithmeticViewSchema = {} as const;
export type OperationsNumberLineArithmeticViewConfig = ConfigFromSchema<
    typeof OperationsNumberLineArithmeticViewSchema
>;
