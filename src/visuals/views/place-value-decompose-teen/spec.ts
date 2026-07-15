import { ViewSpec, limitsAndMean } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'place-value-decompose-teen',
    supportedLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        ones: { type: 'range', min: 0, max: 9 },
        mode: { type: 'options', values: ['decompose-teen'] }
    },
    testParams: {
        ones: (c) => limitsAndMean(c),
        mode: (c) => 'decompose-teen',
        target: (key, params) => 10 + params.ones
    }
};
