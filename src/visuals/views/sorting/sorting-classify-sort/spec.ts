import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-sort',
    generalLabels: [
        Ability.ProcedureExecution,
        Scope.ShapeProperties
    ]
};


export const SortingClassifySortViewSchema = {} as const;

export type SortingClassifySortViewConfig = ConfigFromSchema<typeof SortingClassifySortViewSchema>;
