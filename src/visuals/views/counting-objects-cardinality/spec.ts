import { ViewSpec, limitsAndMean } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-cardinality',
    supportedLabels: [
        Area.Numeration,
        Area.NumericIdentity,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Scope.AdditiveCount,
        Scope.ArabicNumerals,
        Scope.ObjectArrangement,
        Ability.ProcedureUnderstanding
    ],
    constraints: {
        numObjects: { type: 'range', min: 1, max: 20 }
    },
    testParams: {
        numObjects: (c) => limitsAndMean(c),
        mode: 'cardinality'
    }
};
