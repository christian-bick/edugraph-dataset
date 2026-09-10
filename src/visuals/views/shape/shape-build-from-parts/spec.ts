import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-build-from-parts',
    generalLabels: [Scope.GeometrySticks, Ability.ConceptSpecification, Ability.VisualArticulation]
};

export const ShapeBuildFromPartsViewSchema = {} as const;
export type ShapeBuildFromPartsViewConfig = ConfigFromSchema<typeof ShapeBuildFromPartsViewSchema>;
