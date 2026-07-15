import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-write',
    supportedLabels: [
        Area.DigitNotation,
        Area.Numeration,
        Scope.ArabicNumerals,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        number: { type: 'range', min: 0, max: 20 },
        outline: { type: 'options', values: [true, false] },
        mode: { type: 'options', values: ['stroke', 'count-objects'] }
    },
    testParams: {
        number: (c) => limitsAndMean(c),
        outline: (c) => allOptions(c),
        mode: (c) => allOptions(c)
    }
};
