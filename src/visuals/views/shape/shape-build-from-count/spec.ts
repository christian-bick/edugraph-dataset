import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Area} from 'edugraph-ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
export const spec: ViewSpec = {
    viewId: 'shape-build-from-count',
    generalLabels: [Area.ShapeClassification, Ability.ConceptSpecification, Ability.VisualArticulation],
    compatibility: [
        requireTargetLabels('shape-classification-request', [Area.ShapeClassification])
    ]
};
export const ShapeBuildFromCountViewSchema = {} as const;
export type ShapeBuildFromCountViewConfig = ConfigFromSchema<typeof ShapeBuildFromCountViewSchema>;
