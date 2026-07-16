import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-count-out',
    supportedLabels: [
        Area.Numeration,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Scope.AdditiveCount,
        Ability.ProcedureExecution,
        Scope.ArabicNumerals,
        Scope.ObjectArrangement
    ]
};
