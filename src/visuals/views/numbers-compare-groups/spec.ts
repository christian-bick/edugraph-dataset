import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare-groups',
    supportedLabels: [
        Area.Numeration,
        Area.NumericComparison,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Ability.ProcedureExecution
    ],
    constraints: {
        num1: { type: 'range', min: 1, max: 10 },
        num2: { type: 'range', min: 1, max: 10 },
        comparisonType: { type: 'options', values: ['greater', 'less', 'equal'] }
    },
    testParams: {
        num1: (c) => limitsAndMean(c),
        num2: (c) => limitsAndMean(c),
        relation: (c) => allOptions(c),
        mode: 'matching',
        answer: (key, params) => {
            if (params.relation === 'more') return params.num1 > params.num2 ? 'A' : 'B';
            if (params.relation === 'fewer') return params.num1 < params.num2 ? 'A' : 'B';
            return 'equal';
        }
    }
};
