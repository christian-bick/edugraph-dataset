import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability} from 'edugraph-ts';

export const spec: ViewSpec = {
    viewId: 'area-perimeter-comparison',
    generalLabels: [Ability.ConceptClassification]
};

export const AreaPerimeterComparisonViewSchema = {} as const;

export type AreaPerimeterComparisonViewConfig = ConfigFromSchema<
    typeof AreaPerimeterComparisonViewSchema
>;
