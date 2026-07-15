import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare',
    supportedLabels: [
        Area.Numeration,
        Area.NumericComparison,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Ability.ProcedureExecution
    ],
    constraints: {
        num1: { type: 'range', min: 0, max: 20 },
        num2: { type: 'range', min: 0, max: 20 }
    },
    testParams: {
        num1: (c) => limitsAndMean(c),
        num2: (c) => limitsAndMean(c),
        relation: (c) => allOptions(c),
        answer: (key, params) => {
            if (params.relation === 'greater') return params.num1 > params.num2;
            if (params.relation === 'less') return params.num1 < params.num2;
            return params.num1 === params.num2;
        }
    }
};
