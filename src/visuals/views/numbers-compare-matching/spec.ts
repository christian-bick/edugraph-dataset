import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare-matching',
    supportedLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ],
};
