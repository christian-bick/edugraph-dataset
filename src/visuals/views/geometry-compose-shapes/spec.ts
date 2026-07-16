import { ViewSpec } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-compose-shapes',
    supportedLabels: [
        Area.Triangle,
        Area.Circle,
        Ability.ConceptComposition
    ]
};
