import {ViewSpec} from '../../../../types/view-spec.ts';
import {Ability, Area, Scope} from 'edugraph-ts';
import { ConfigFromSchema } from '../../../../types/schema.ts';

export const spec: ViewSpec = {
    viewId: 'sorting-classify-sort',
    generalLabels: [
        Ability.ProcedureExecution,
        Area.ShapeRecognition
    ],
    compatibility: [{
        id: 'category-extremum-relation',
        dependencies: [
            {scope: 'generator', label: Scope.Least},
            {scope: 'generator', label: Scope.Most}
        ],
        predicate: labels => labels.has('generator', Scope.Least) || labels.has('generator', Scope.Most)
    }]
};


export const SortingClassifySortViewSchema = {} as const;

export type SortingClassifySortViewConfig = ConfigFromSchema<typeof SortingClassifySortViewSchema>;
