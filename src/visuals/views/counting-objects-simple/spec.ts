import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'counting-objects-simple',
    supportedLabels: [
        Area.Numeration,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding
    ],
    constraints: {
        numObjects: { type: 'range', min: 1, max: 20 },
        arrangement: { type: 'options', values: ['line', 'circle', 'scattered', 'array'] }
    },
    testParams: {
        numObjects: (c) => limitsAndMean(c),
        arrangement: (c) => allOptions(c)
    }
};
