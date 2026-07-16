import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-compose-shapes',
    supportedLabels: [
        Area.Geometry,
        Ability.ProcedureExecution
    ],
    constraints: {
        target: { type: 'options', values: ['rectangle', 'square'] }
    },
    testParams: {
        target: (c) => allOptions(c),
        answer: (key, params) => 'triangle'
    }
};
