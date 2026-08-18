import {Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-comparison',
    generalLabels: [
        Scope.SingleFrameOfReference,
        Scope.VisualNumbers
    ]
};

export const NumbersDecimalComparisonViewSchema = {} as const;

export type NumbersDecimalComparisonViewConfig = ConfigFromSchema<
    typeof NumbersDecimalComparisonViewSchema
>;
