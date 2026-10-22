import {Ability, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-rational-line-reading',
    generalLabels: [Scope.Numberline, Ability.VisualReception],
    compatibility: [requireTargetLabels('rational-line-reading-task', [Ability.VisualReception])]
};
export const NumbersRationalLineReadingViewSchema = {} as const;
export type NumbersRationalLineReadingViewConfig = ConfigFromSchema<typeof NumbersRationalLineReadingViewSchema>;
