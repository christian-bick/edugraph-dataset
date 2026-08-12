import {Ability} from 'edugraph-ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'measure-unit-scale-relation',
    generalLabels: [Ability.ConceptDerivation]
};
export const MeasureUnitScaleRelationViewSchema = {} as const;
export type MeasureUnitScaleRelationViewConfig = ConfigFromSchema<typeof MeasureUnitScaleRelationViewSchema>;
