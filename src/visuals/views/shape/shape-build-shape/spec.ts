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
    requiredLabels: [Area.ShapeClassification],
};


export const ShapeBuildShapeViewSchema = {} as const;

export type ShapeBuildShapeViewConfig = ConfigFromSchema<typeof ShapeBuildShapeViewSchema>;
