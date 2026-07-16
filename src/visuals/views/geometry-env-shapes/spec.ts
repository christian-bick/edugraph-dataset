import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-env-shapes',
    supportedLabels: [
        Area.Circle,
        Area.Triangle,
        Ability.ProcedureExecution
    ],
    constraints: {
        target: { type: 'options', values: ['clock', 'window', 'table'] }
    },
};
