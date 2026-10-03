import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-numerical-expression-interpretation',
    generalLabels: [Scope.ArabicNumerals, Ability.Interpretation]
};

export const OperationsNumericalExpressionInterpretationViewSchema = {} as const;

export type OperationsNumericalExpressionInterpretationViewConfig = ConfigFromSchema<typeof OperationsNumericalExpressionInterpretationViewSchema>;
