import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-draw-shape',
    supportedLabels: [
        Area.Geometry,
        Ability.ProcedureExecution
    ],
    constraints: {
        target: { type: 'options', values: ['circle', 'square', 'triangle'] }
    },
    testParams: {
        target: (c) => allOptions(c),
        answer: (key, params) => params.target
    }
};
