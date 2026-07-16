import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

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
        bandLength: { type: 'range', min: 5, max: 15 },
        decimal: { type: 'options', values: [true, false] }
    },
    testParams: {
        bandLength: (c) => limitsAndMean(c),
        decimal: (c) => allOptions(c),
        problemLength: (key, params) => params.bandLength - 2
    }
};
