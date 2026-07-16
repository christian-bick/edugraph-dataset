import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-build-shape',
    supportedLabels: [
        Area.Geometry,
        Ability.ProcedureExecution
    ],
    constraints: {
        target: { type: 'options', values: ['triangle', 'square', 'rectangle', 'hexagon'] }
    },
    testParams: {
        target: (c) => allOptions(c)
    }
};
