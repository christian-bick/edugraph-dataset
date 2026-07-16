import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Scope, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'measure-compare',
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
        attribute: (c) => allOptions(c),
        relation: (key, params) => params.attribute === 'length' ? 'longer' : (params.attribute === 'height' ? 'taller' : 'heavier'),
        val1: 8,
        val2: 4,
        answer: 'A'
    }
};
