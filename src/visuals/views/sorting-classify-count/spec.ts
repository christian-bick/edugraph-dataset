import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-count',
    supportedLabels: [
        Area.ObjectSorting,
        Area.CollectionSense,
        Area.Numeration,
        Scope.NumericRange,
        Ability.ConceptClassification,
        Scope.ShapeProperties
    ]
};


export const SortingClassifyCountViewSchema = {
    // TODO: Consider other ontological properties like Scope.ShapeProperties
    range: [
        deductCompatible([Scope.NumbersWithZero, Scope.NumbersSmaller10000]),
        resolveRangeFromLabels
    ]
} as const;

export type SortingClassifyCountViewConfig = ConfigFromSchema<typeof SortingClassifyCountViewSchema>;
