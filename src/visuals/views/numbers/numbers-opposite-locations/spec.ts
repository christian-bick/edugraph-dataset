import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-opposite-locations',
    generalLabels: [Ability.Interpretation, Scope.Numberline, Scope.ArabicNumerals, Scope.Base10],
    compatibility: [requireTargetLabels('numbers-opposite-locations-task', [Scope.Numberline, Scope.NumbersWithNegatives]), {
        id: 'opposite-locations-projection', dependencies: [{scope: 'generator', label: Area.RulesOfSigns}, {scope: 'generator', label: Area.Zero}],
        predicate: labels => !labels.exact('generator', Area.RulesOfSigns) && !labels.exact('generator', Area.Zero)
    }]
};
export const NumbersOppositeLocationsViewSchema = {} as const;
export type NumbersOppositeLocationsViewConfig = ConfigFromSchema<typeof NumbersOppositeLocationsViewSchema>;
