import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'measure-length',
    supportedLabels: [
        Area.Measurement,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        bandLength: { type: 'range', min: 5, max: 15 },
        reverse: { type: 'options', values: [true, false] },
        decimal: { type: 'options', values: [true, false] },
        mode: { type: 'options', values: ['standard'] }
    },
    testParams: {
        bandLength: (c) => limitsAndMean(c),
        reverse: (c) => allOptions(c),
        decimal: (c) => allOptions(c),
        mode: (c) => 'standard',
        problemLength: (key, params) => params.bandLength - 2
    }
};
