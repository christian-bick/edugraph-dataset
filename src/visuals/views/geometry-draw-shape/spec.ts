import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-draw-shape',
    supportedLabels: [
        Area.ShapePlotting,
        Ability.VisualArticulation
    ],
};
