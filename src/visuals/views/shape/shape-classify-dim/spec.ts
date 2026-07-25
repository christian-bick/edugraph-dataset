import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {hasSubConcept} from '../../../../lib/resolvers.ts';

export const spec: ViewSpec = {
    viewId: 'shape-classify-dim',
    generalLabels: [
        Ability.ConceptClassification
    ]
};


export const ShapeClassifyDimViewSchema = {
    wants2D: [
        [Scope.TwoDimensional],
        hasSubConcept(Scope.TwoDimensional)
    ],
    wants3D: [
        [Scope.ThreeDimensional],
        hasSubConcept(Scope.ThreeDimensional)
    ]
} as const;

export type ShapeClassifyDimViewConfig = ConfigFromSchema<typeof ShapeClassifyDimViewSchema>;
