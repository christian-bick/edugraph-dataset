import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-naming',
    supportedLabels: [
        Area.Geometry,
        Ability.VisualRecognition
    ],
    constraints: {
        shape: { type: 'options', values: ['circle', 'square', 'rectangle', 'triangle', 'hexagon', 'cube', 'cone', 'cylinder', 'sphere'] }
    },};
