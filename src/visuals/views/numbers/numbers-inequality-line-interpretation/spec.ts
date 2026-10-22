import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-inequality-line-interpretation',
    generalLabels: [Scope.Numberline, Ability.Interpretation],
    compatibility: [requireTargetLabels('numbers-inequality-line-interpretation-task', [Area.Inequality])]
};
export const NumbersInequalityLineInterpretationViewSchema = {} as const;
export type NumbersInequalityLineInterpretationViewConfig = ConfigFromSchema<typeof NumbersInequalityLineInterpretationViewSchema>;
