import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare',
    supportedLabels: [
        Area.Numeration,
        Area.NumericComparison,
        Scope.ArabicNumerals,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ],
        testParams: {
        relation: (c) => allOptions(c),
        answer: (key, params) => {
            if (params.relation === 'greater') return params.num1 > params.num2;
            if (params.relation === 'less') return params.num1 < params.num2;
            return params.num1 === params.num2;
        }
    }
};
