import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare-counting',
    supportedLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ],
    constraints: {
        comparisonType: { type: 'options', values: ['greater', 'less', 'equal'] }
    },
    testParams: {
        relation: (c) => allOptions(c),
        answer: (key, params) => {
            if (params.relation === 'more') return params.num1 > params.num2 ? 'A' : 'B';
            if (params.relation === 'fewer') return params.num1 < params.num2 ? 'A' : 'B';
            return 'equal';
        }
    }
};
