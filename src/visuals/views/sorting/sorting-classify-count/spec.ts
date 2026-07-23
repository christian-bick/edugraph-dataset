import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-count',
    generalLabels: [
        Ability.ConceptClassification,
        Scope.ShapeProperties,
        Scope.ArabicNumerals
    ]
};


export const SortingClassifyCountViewSchema = {} as const;

export type SortingClassifyCountViewConfig = ConfigFromSchema<typeof SortingClassifyCountViewSchema>;
