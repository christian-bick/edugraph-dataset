import {Ability, Scope} from 'edugraph-ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-table',
    generalLabels: [Scope.ArabicNumerals]
};

export const OperationsPatternTableViewSchema = {
    classificationMode: [
        [Ability.ConceptClassification],
        hasLabel(Ability.ConceptClassification)
    ],
    executionMode: [
        [Ability.ProcedureExecution],
        hasLabel(Ability.ProcedureExecution)
    ]
} as const;
export type OperationsPatternTableViewConfig = ConfigFromSchema<typeof OperationsPatternTableViewSchema>;
