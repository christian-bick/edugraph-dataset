import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-fraction-line',
    generalLabels: [
        Scope.Numberline,
        Scope.SingleFrameOfReference,
        Ability.VisualArticulation
    ]
};

export const NumbersFractionLineViewSchema = {} as const;

export type NumbersFractionLineViewConfig = ConfigFromSchema<
    typeof NumbersFractionLineViewSchema
>;
