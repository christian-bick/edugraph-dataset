import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-numerical-expression-write',
    generalLabels: [Scope.ArabicNumerals, Ability.Formalization, Ability.TextualReception],
    compatibility: [
        requireTargetLabels('written-calculation-request', [Ability.TextualReception])
    ]
};

export const OperationsNumericalExpressionWriteViewSchema = {} as const;

export type OperationsNumericalExpressionWriteViewConfig = ConfigFromSchema<typeof OperationsNumericalExpressionWriteViewSchema>;
