import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-decimal-line',
    generalLabels: [
        Area.NumerationWithDecimals,
        Scope.Numberline,
        Scope.SingleFrameOfReference,
        Ability.VisualArticulation
    ]
};

export const NumbersDecimalLineViewSchema = {} as const;

export type NumbersDecimalLineViewConfig = ConfigFromSchema<
    typeof NumbersDecimalLineViewSchema
>;
