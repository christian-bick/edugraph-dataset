import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';
import {selectMissingTermIndex} from '../pattern-table-helpers.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-generation-practice',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureExecution
    ],
    requiredLabels: [Area.PatternGeneration]
};

export const OperationsPatternGenerationPracticeViewSchema = {
    missingTermIndex: selectMissingTermIndex
} as const;

export type OperationsPatternGenerationPracticeViewConfig = ConfigFromSchema<
    typeof OperationsPatternGenerationPracticeViewSchema
>;
