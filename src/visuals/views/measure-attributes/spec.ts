import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'measure-attributes',
    supportedLabels: [
        Area.Measurement,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        attribute: { type: 'options', values: ['length', 'height', 'weight'] }
    },
    testParams: {
        attribute: (c) => allOptions(c)
    }
};
