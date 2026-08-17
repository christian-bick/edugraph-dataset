import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {hasLabel} from '../../../../lib/resolvers.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-explanation',
    generalLabels: [Scope.ArabicNumerals]
};

export const OperationsPatternExplanationViewSchema = {
    explanationMode: [
        [Ability.ProcedureUnderstanding, Ability.TextualArticulation],
        hasLabel(Ability.ProcedureUnderstanding)
    ]
} as const;
export type OperationsPatternExplanationViewConfig = ConfigFromSchema<typeof OperationsPatternExplanationViewSchema>;
