import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-sort',
    supportedLabels: [
        Area.ObjectSorting,
        Area.NumericOrder,
        Scope.NumericRange,
        Scope.NumbersWithZero,
        Ability.ProcedureExecution
    ],
    constraints: {
        classifyType: { type: 'options', values: ['shape', 'color'] },
        relation: { type: 'options', values: ['most', 'least'] },
    },};
