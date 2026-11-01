import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-double-opposite',
    generalLabels: [Ability.Interpretation, Scope.ArabicNumerals, Scope.Base10],
    compatibility: [requireTargetLabels('numbers-double-opposite-task', [Area.RulesOfSigns]), {
        id: 'double-opposite-projection', dependencies: [{scope: 'generator', label: Area.RulesOfSigns}],
        predicate: labels => labels.exact('generator', Area.RulesOfSigns)
    }]
};
export const NumbersDoubleOppositeViewSchema = {} as const;
export type NumbersDoubleOppositeViewConfig = ConfigFromSchema<typeof NumbersDoubleOppositeViewSchema>;
