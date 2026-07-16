import {limitsAndMean, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'place-value-make-ten',
    supportedLabels: [
        Area.BaseOperations,
        Scope.PhysicalNumbers,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        givenNumber: { type: 'range', min: 1, max: 9 }
    },
    testParams: {
        givenNumber: (c) => limitsAndMean(c),
        missingNumber: (key, params) => 10 - params.givenNumber
    }
};
