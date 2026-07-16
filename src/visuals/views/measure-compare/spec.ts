import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'measure-compare',
    supportedLabels: [
        Area.Measurement,
        Scope.NumericRange,
        Scope.ArabicNumerals,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution,
        Scope.LengthMeasurement,
        Scope.WeightMeasurement
    ],
};
