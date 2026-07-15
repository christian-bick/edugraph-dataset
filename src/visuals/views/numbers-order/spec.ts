import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-order',
    supportedLabels: [
        Area.NumerationWithIntegers,
        Scope.ArabicNumerals,
        Scope.Base10,
        Scope.NumericRange,
        Scope.NumericZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        desc: { type: 'options', values: [true, false] }
    },
    testParams: {
        desc: (c) => allOptions(c),
        numbers: () => [3, 1, 4, 2]
    }
};
