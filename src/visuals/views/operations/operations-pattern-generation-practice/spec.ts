import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-generation-practice',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ]
};

export const OperationsPatternGenerationPracticeViewSchema = {} as const;

export type OperationsPatternGenerationPracticeViewConfig = ConfigFromSchema<
    typeof OperationsPatternGenerationPracticeViewSchema
>;
