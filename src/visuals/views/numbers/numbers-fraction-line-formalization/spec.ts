import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-fraction-line-formalization',
    generalLabels: [
        Scope.Numberline,
        Scope.SingleFrameOfReference,
        Ability.Formalization
    ]
};

export const NumbersFractionLineFormalizationViewSchema = {} as const;
export type NumbersFractionLineFormalizationViewConfig = ConfigFromSchema<
    typeof NumbersFractionLineFormalizationViewSchema
>;
