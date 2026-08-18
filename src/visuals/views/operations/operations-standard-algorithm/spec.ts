import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-standard-algorithm',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};

export const OperationsStandardAlgorithmViewSchema = {} as const;

export type OperationsStandardAlgorithmViewConfig = ConfigFromSchema<
    typeof OperationsStandardAlgorithmViewSchema
>;
