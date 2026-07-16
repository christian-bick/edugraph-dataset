import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-naming',
    supportedLabels: [
        Area.Geometry,
        Ability.ProcedureExecution
    ],
    constraints: {
        shape: { type: 'options', values: ['circle', 'square', 'rectangle', 'triangle', 'hexagon', 'cube', 'cone', 'cylinder', 'sphere'] }
    },
    testParams: {
        shape: (c) => allOptions(c),
        answer: (key, params) => params.shape
    }
};
