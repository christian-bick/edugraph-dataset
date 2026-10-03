import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-hierarchy-classification',
    generalLabels: [Ability.ConceptClassification, Ability.VisualArticulation],
    compatibility: [requireTargetLabels('shape-hierarchy-request', [Area.ShapeSubsumption])]
};

export const ShapeHierarchyClassificationViewSchema = {} as const;
export type ShapeHierarchyClassificationViewConfig = ConfigFromSchema<typeof ShapeHierarchyClassificationViewSchema>;
