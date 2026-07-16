import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare-counting',
    supportedLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ],
    constraints: {
        comparisonType: { type: 'options', values: ['greater', 'less', 'equal'] }
    },};
