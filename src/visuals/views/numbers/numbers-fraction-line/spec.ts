import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-fraction-line',
    generalLabels: [
        Scope.Numberline,
        Scope.SingleFrameOfReference
    ]
};

export const NumbersFractionLineViewSchema = {
    visualArticulation: [
        [Ability.VisualArticulation],
        hasLabel(Ability.VisualArticulation)
    ]
} as const;

export type NumbersFractionLineViewConfig = ConfigFromSchema<
    typeof NumbersFractionLineViewSchema
>;
