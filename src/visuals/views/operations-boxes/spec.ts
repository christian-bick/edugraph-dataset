import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'operations-boxes',
    supportedLabels: [
        Area.BaseOperations,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        operation: { type: 'options', values: ['addition', 'subtraction', 'multiplication', 'division'] },
        blankPart: { type: 'options', values: ['num1', 'num2', 'solution'] }
    },
    testParams: {
        operation: (c) => allOptions(c),
        blankPart: (c) => allOptions(c),
        answer: (key, params) => {
            const n1 = params.num1;
            const n2 = params.num2;
            if (params.operation === 'subtraction') return n1 - n2;
            if (params.operation === 'multiplication') return n1 * n2;
            if (params.operation === 'division') return n2 !== 0 ? Math.floor(n1 / n2) : 0;
            return n1 + n2;
        }
    }
};
