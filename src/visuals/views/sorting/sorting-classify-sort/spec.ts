import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-sort',
    generalLabels: [
        Ability.ProcedureExecution,
        Area.ShapeRecognition
    ]
};


export const SortingClassifySortViewSchema = {} as const;

export type SortingClassifySortViewConfig = ConfigFromSchema<typeof SortingClassifySortViewSchema>;
