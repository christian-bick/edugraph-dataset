import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-position',
    supportedLabels: [
        Area.Geometry,
        Ability.ProcedureExecution,
        Scope.SpatialDirection
    ],
    constraints: {
        relation: { type: 'options', values: ['above', 'below', 'beside', 'nextTo'] }
    },
    testParams: {
        relation: (c) => allOptions(c),
        answer: (key, params) => params.relation
    }
};
