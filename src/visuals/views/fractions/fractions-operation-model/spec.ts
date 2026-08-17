import {Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-operation-model',
    generalLabels: [Scope.VisualNumbers]
};

export const FractionsOperationModelViewSchema = {} as const;

export type FractionsOperationModelViewConfig = ConfigFromSchema<
    typeof FractionsOperationModelViewSchema
>;
