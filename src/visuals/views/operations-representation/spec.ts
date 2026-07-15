import { ViewSpec, limitsAndMean, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'operations-representation',
    supportedLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Ability.ProcedureExecution,
        Ability.ProblemSolving
    ],
    constraints: {
        operation: { type: 'options', values: ['addition', 'subtraction'] },
        num1: { type: 'range', min: 1, max: 10 },
        num2: { type: 'range', min: 1, max: 10 }
    },
    testParams: {
        operation: (c) => allOptions(c),
        num1: (c) => limitsAndMean(c),
        num2: (c) => limitsAndMean(c),
        answer: (key, params) => params.operation === 'addition' ? params.num1 + params.num2 : params.num1 - params.num2,
        textScenario: 'Test Scenario'
    }
};
