import {ViewSpec} from '../../../types/view-spec.ts';
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
        testParams: {
        missingNumber: (key, params) => 10 - params.givenNumber
    }
};
