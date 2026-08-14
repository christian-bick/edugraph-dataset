import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-pattern-explanation',
    generalLabels: [
        Scope.ArabicNumerals,
        Ability.ProcedureUnderstanding,
        Ability.TextualArticulation
    ]
};

export const OperationsPatternExplanationViewSchema = {} as const;
export type OperationsPatternExplanationViewConfig = ConfigFromSchema<typeof OperationsPatternExplanationViewSchema>;
