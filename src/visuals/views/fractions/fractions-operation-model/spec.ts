import {Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {FractionArithmeticViewSchema} from '../fraction-arithmetic-presentation.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-operation-model',
    generalLabels: [Scope.VisualNumbers]
};

export const FractionsOperationModelViewSchema = FractionArithmeticViewSchema;

export type FractionsOperationModelViewConfig = ConfigFromSchema<
    typeof FractionsOperationModelViewSchema
>;
