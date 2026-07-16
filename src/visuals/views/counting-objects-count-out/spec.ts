import { ViewSpec, limitsAndMean } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

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
    ],
    constraints: {
        numObjects: { type: 'range', min: 1, max: 17 }
    },
    testParams: {
        numObjects: (c) => limitsAndMean(c),
        mode: 'count-out'
    }
};
