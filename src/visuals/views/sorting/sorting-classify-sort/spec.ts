import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-sort',
    generalLabels: [
        Area.ObjectSorting,
        Area.NumericOrder,
        Scope.NumericRange,
        Ability.ProcedureExecution,
        Scope.ShapeProperties
    ]
};


export const SortingClassifySortViewSchema = {} as const;

export type SortingClassifySortViewConfig = ConfigFromSchema<typeof SortingClassifySortViewSchema>;
