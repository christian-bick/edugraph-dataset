import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-zero-opposite',
    generalLabels: [Ability.Interpretation, Scope.Numberline, Scope.ArabicNumerals, Scope.Base10],
    compatibility: [requireTargetLabels('numbers-zero-opposite-task', [Area.Zero, Scope.NumbersWithZero, Scope.Numberline]), {
        id: 'zero-opposite-projection', dependencies: [{scope: 'generator', label: Area.Zero}],
        predicate: labels => labels.exact('generator', Area.Zero)
    }]
};
export const NumbersZeroOppositeViewSchema = {} as const;
export type NumbersZeroOppositeViewConfig = ConfigFromSchema<typeof NumbersZeroOppositeViewSchema>;
