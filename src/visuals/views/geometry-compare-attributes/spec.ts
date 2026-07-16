import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-compare-attributes',
    supportedLabels: [
        Area.Geometry,
        Ability.ProcedureExecution
    ],
    constraints: {
        attribute: { type: 'options', values: ['sides', 'corners'] },
        shape1: { type: 'options', values: ['circle', 'square', 'rectangle', 'triangle', 'hexagon'] },
        shape2: { type: 'options', values: ['circle', 'square', 'rectangle', 'triangle', 'hexagon'] }
    },
    testParams: {
        attribute: (c) => allOptions(c),
        shape1: (c) => allOptions(c),
        shape2: (c) => allOptions(c),
        answer: (key, params) => params.shape1
    }
};
