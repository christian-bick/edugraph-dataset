import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-count',
    generalLabels: [
        Area.ObjectSorting,
        Area.CollectionSense,
        Area.Numeration,
        Scope.NumericRange,
        Ability.ConceptClassification,
        Scope.ShapeProperties
    ,
        Scope.ArabicNumerals]
};


export const SortingClassifyCountViewSchema = {} as const;

export type SortingClassifyCountViewConfig = ConfigFromSchema<typeof SortingClassifyCountViewSchema>;
