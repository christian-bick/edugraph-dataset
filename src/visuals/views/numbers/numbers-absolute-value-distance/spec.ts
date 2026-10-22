import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-absolute-value-distance',
    generalLabels: [Scope.Numberline, Ability.Interpretation],
    compatibility: [requireTargetLabels('numbers-absolute-value-distance-task', [Area.AbsoluteNumberMagnitude])]
};
export const NumbersAbsoluteValueDistanceViewSchema = {} as const;
export type NumbersAbsoluteValueDistanceViewConfig = ConfigFromSchema<typeof NumbersAbsoluteValueDistanceViewSchema>;
