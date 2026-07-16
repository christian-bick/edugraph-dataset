import {allOptions, ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'geometry-classify-dim',
    supportedLabels: [
        Ability.ConceptClassification
    ],
};
