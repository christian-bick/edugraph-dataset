import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-simple',
    supportedLabels: [
        Area.Numeration,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Scope.ArabicNumerals,
        Scope.ObjectArrangement,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ]
};
