import { ViewSpec, limitsAndMean } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'place-value-compose-teen',
    supportedLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        ones: { type: 'range', min: 0, max: 9 },
        mode: { type: 'options', values: ['compose-teen'] }
    },
    testParams: {
        ones: (c) => limitsAndMean(c),
        mode: (c) => 'compose-teen',
        target: (key, params) => 10 + params.ones
    }
};
