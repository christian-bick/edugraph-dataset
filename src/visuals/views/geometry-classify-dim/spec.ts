import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {hasSubConcept} from '../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-classify-dim',
    supportedLabels: [
        Ability.ConceptClassification
    ]
};

export const GeometryClassifyDimGeneralLabels = [
    Ability.ConceptClassification
];

export const GeometryClassifyDimViewSchema = {
    wants2D: [
        [Scope.TwoDimensional], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.TwoDimensional)
    ],
    wants3D: [
        [Scope.ThreeDimensional], // TODO: Consider ontological relations if applicable
        hasSubConcept(Scope.ThreeDimensional)
    ]
} as const;

export type GeometryClassifyDimViewConfig = ConfigFromSchema<typeof GeometryClassifyDimViewSchema>;
