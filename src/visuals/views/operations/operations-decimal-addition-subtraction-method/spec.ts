import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-decimal-addition-subtraction-method',
    generalLabels: [
        Scope.ArabicNumerals,
        Scope.VisualNumbers,
        Ability.ProcedureExecution,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ]
};

export const OperationsDecimalAdditionSubtractionMethodViewSchema = {} as const;
export type OperationsDecimalAdditionSubtractionMethodViewConfig = ConfigFromSchema<
    typeof OperationsDecimalAdditionSubtractionMethodViewSchema
>;
