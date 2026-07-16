import { ViewSpec } from '../../../types/view-spec.ts';
import { Area, Ability } from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-compare-attributes',
    supportedLabels: [
        Ability.VisualDecomposition
    ],
    constraints: {
        attribute: { type: 'options', values: ['sides', 'corners'] },
    },
};
