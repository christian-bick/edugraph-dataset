import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-zero-opposite',
    generalLabels: [Ability.Interpretation, Scope.Numberline],
    compatibility: [requireTargetLabels('numbers-zero-opposite-task', [Area.ZeroConcept, Scope.NumbersWithZero, Scope.Numberline])]
};
export const NumbersZeroOppositeViewSchema = {} as const;
export type NumbersZeroOppositeViewConfig = ConfigFromSchema<typeof NumbersZeroOppositeViewSchema>;
