import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'operations-vertical',
    supportedLabels: [
        Area.BaseOperations,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        operation: { type: 'options', values: ['addition', 'subtraction', 'multiplication', 'division'] }
    },
    testParams: {
        operation: (c) => allOptions(c),
        answer: (key, params) => {
            const op = params.operation;
            const n1 = params.num1;
            const n2 = params.num2;
            if (op === 'addition' || op === 'add') return n1 + n2;
            if (op === 'subtraction' || op === 'subtract') return n1 - n2;
            if (op === 'multiplication' || op === 'multiply') return n1 * n2;
            if (op === 'division' || op === 'divide') return n2 !== 0 ? n1 / n2 : 0;
            return 0;
        }
    }
};
