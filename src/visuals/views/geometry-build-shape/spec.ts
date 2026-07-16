import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';

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
