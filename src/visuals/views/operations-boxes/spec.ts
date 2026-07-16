import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'operations-boxes',
    supportedLabels: [
        Area.BaseOperations,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        operation: { type: 'options', values: ['addition', 'subtraction', 'multiplication', 'division'] },
        blankPart: { type: 'options', values: ['num1', 'num2', 'solution'] }
    },};
