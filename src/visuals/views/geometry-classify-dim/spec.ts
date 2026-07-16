import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-classify-dim',
    supportedLabels: [
        Area.Geometry,
        Ability.ProcedureExecution
    ],
    constraints: {
        shapeType: { type: 'options', values: ['2d', '3d'] },
        shape: { type: 'options', values: ['circle', 'square', 'rectangle', 'triangle', 'hexagon', 'cube', 'cone', 'cylinder', 'sphere'] }
    },
    testParams: {
        shapeType: (c) => allOptions(c),
        shape: (c) => allOptions(c),
        answer: (key, params) => params.shapeType
    }
};
