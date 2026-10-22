import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'algebra-subexpression-interpretation',
    generalLabels: [Scope.ArabicNumerals, Ability.Interpretation],
    compatibility: [
        requireTargetLabels('algebra-grouped-operand-task', [Area.GroupingSymbol, Area.Operand])
    ]
};
export const AlgebraSubexpressionInterpretationViewSchema = {} as const;
export type AlgebraSubexpressionInterpretationViewConfig = ConfigFromSchema<typeof AlgebraSubexpressionInterpretationViewSchema>;
