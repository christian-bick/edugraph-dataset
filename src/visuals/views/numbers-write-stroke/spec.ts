import {allOptions, limitsAndMean, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write-stroke',
    supportedLabels: [
        Area.DigitNotation,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        number: { type: 'range', min: 0, max: 20 },
        outline: { type: 'options', values: [true, false] }
    },
    testParams: {
        number: (c) => limitsAndMean(c),
        outline: (c) => allOptions(c)
    }
};
