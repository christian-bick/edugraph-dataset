import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-order',
    supportedLabels: [
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumericRange,
        Scope.NumericZero,
        Ability.ProcedureExecution,
        Scope.OrderAbstraction
    ]
};
