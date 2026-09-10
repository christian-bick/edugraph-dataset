import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'geometry-angle-concepts',
    generalLabels: [Ability.Interpretation, Area.FractionDenominatorInterpretation]
};

export const GeometryAngleConceptsViewSchema = {} as const;

export type GeometryAngleConceptsViewConfig = ConfigFromSchema<
    typeof GeometryAngleConceptsViewSchema
>;
