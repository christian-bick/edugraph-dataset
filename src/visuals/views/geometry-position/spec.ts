import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-position',
    supportedLabels: [
        Area.Geometry,
        Ability.ProcedureExecution
    ],
    constraints: {
        relation: { type: 'options', values: ['above', 'below', 'beside', 'nextTo'] }
    },
    testParams: {
        relation: (c) => allOptions(c),
        answer: (key, params) => params.relation
    }
};
