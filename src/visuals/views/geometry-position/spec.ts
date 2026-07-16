import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-position',
    supportedLabels: [
        Ability.SpatialInterpretation,
    ]
};
