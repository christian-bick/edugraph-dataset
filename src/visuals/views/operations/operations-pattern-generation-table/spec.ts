import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-generation-table',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};

export const OperationsPatternGenerationTableViewSchema = {} as const;

export type OperationsPatternGenerationTableViewConfig = ConfigFromSchema<
    typeof OperationsPatternGenerationTableViewSchema
>;
