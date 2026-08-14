import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-equal-groups',
    generalLabels: [
        Scope.PhysicalNumbers,
        Scope.ArabicNumerals
    ]
};

export const OperationsEqualGroupsViewSchema = {
    responseMode: [Ability.Interpretation]
} as const;

export type OperationsEqualGroupsViewConfig = ConfigFromSchema<
    typeof OperationsEqualGroupsViewSchema
>;
