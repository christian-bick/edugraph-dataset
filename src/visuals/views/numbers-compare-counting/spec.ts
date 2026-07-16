import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'numbers-compare-counting',
    supportedLabels: [
        Scope.PhysicalNumbers,
        Ability.ProcedureExecution
    ]
};
