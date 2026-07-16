import { ViewSpec, limitsAndMean } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-one-to-one',
    supportedLabels: [
        Area.Numeration,
        Scope.NumbersWithoutZero,
        Scope.AdditiveCount,
        Scope.ArabicNumerals,
        Scope.ObjectArrangement,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        numObjects: { type: 'range', min: 1, max: 20 }
    },
    testParams: {
        numObjects: (c) => limitsAndMean(c),
        mode: 'one-to-one'
    }
};
