import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'shape-build-shape',
    generalLabels: [
        Area.ShapeClassification,
        Scope.ShapeAttributes,
        Ability.ConceptSpecification,
        Ability.VisualArticulation
    ],
    compatibility: [
        requireTargetLabels('shape-classification-request', [Area.ShapeClassification])
    ],
};


export const ShapeBuildShapeViewSchema = {} as const;

export type ShapeBuildShapeViewConfig = ConfigFromSchema<typeof ShapeBuildShapeViewSchema>;
