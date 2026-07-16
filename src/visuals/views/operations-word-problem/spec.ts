import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'operations-word-problem',
    supportedLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.TextualReception
    ],
    constraints: {
        operation: { type: 'options', values: ['addition', 'subtraction'] },
    },
    testParams: {
        operation: (c) => allOptions(c),
        answer: (key, params) => params.operation === 'addition' ? params.num1 + params.num2 : params.num1 - params.num2,
        textScenario: 'Test Word Problem Scenario'
    }
};
