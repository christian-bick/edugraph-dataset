import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'area-perimeter-construction',
    generalLabels: [
        Ability.ProcedureUnderstanding,
        Ability.VisualArticulation
    ]
};

export const AreaPerimeterConstructionViewSchema = {} as const;

export type AreaPerimeterConstructionViewConfig = ConfigFromSchema<
    typeof AreaPerimeterConstructionViewSchema
>;
