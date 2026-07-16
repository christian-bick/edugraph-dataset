import { ViewSpec, allOptions } from '../../../types/view-spec.ts';
import { Area, Ability, Scope } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-same-attribute',
    supportedLabels: [
        Ability.VisualRecognition,
        Ability.InductiveReasoning,
        Scope.ShapeProperties
    ],
};
