import { ViewSpec, limitsAndMean } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'place-value-compose-teen',
    supportedLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        ones: { type: 'range', min: 0, max: 9 }
    },
    testParams: {
        ones: (c) => limitsAndMean(c),
        target: (key, params) => 10 + params.ones
    }
};
