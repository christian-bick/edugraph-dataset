import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-draw-shape',
    supportedLabels: [
        Area.Geometry,
        Ability.VisualArticulation
    ],
    constraints: {
        shape: { type: 'options', values: ['circle', 'square', 'triangle'] }
    },
    testParams: {
        shape: (c) => allOptions(c),
        answer: (key, params) => params.shape
    }
};
