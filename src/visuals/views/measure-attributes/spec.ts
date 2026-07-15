import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'measure-attributes',
    supportedLabels: [
        Area.Measurement,
        Scope.NumericRange,
        Scope.NumbersWithoutZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        attribute: { type: 'options', values: ['length', 'height', 'weight'] },
        mode: { type: 'options', values: ['attribute-type'] }
    },
    testParams: {
        attribute: (c) => allOptions(c),
        mode: (c) => 'attribute-type'
    }
};
