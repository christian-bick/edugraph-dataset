import {Ability, Area} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-composite-classification',
    generalLabels: [Ability.ConceptClassification],
    requiredLabels: [Area.CompositeNumbers]
};

export const NumbersCompositeClassificationViewSchema = {} as const;
export type NumbersCompositeClassificationViewConfig = ConfigFromSchema<
    typeof NumbersCompositeClassificationViewSchema
>;
