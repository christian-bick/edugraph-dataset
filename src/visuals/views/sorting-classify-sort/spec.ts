import {ViewSpec} from '../../../types/view-spec.ts';
import {Ability, Area, deductCompatible, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../types/schema.ts';
import { resolveRangeFromLabels } from '../../../lib/ontology.ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-sort',
    supportedLabels: [
        Area.ObjectSorting,
        Area.NumericOrder,
        Scope.NumericRange,
        Ability.ProcedureExecution,
        Scope.ShapeProperties
    ]
};


export const SortingClassifySortViewSchema = {
    // TODO: Consider other ontological properties like Scope.ShapeProperties
    range: [
        deductCompatible([Scope.NumbersWithZero, Scope.NumbersSmaller10000]),
        resolveRangeFromLabels
    ]
} as const;

export type SortingClassifySortViewConfig = ConfigFromSchema<typeof SortingClassifySortViewSchema>;
