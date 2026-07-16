import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'measure-length',
    supportedLabels: [
        Area.Measurement,
        Scope.NumericRange,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution,
        Ability.VisualReception,
        Ability.VisualArticulation
    ],
    constraints: {
        decimal: { type: 'options', values: [true, false] }
    }
};
