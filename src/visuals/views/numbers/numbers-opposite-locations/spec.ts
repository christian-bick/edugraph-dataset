import {Ability, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-opposite-locations',
    generalLabels: [Ability.Interpretation, Scope.Numberline],
    compatibility: [requireTargetLabels('numbers-opposite-locations-task', [Scope.Numberline, Scope.NumbersWithNegatives])]
};
export const NumbersOppositeLocationsViewSchema = {} as const;
export type NumbersOppositeLocationsViewConfig = ConfigFromSchema<typeof NumbersOppositeLocationsViewSchema>;
