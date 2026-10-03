import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-power-ten-decimal-pattern-explanation',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureUnderstanding, Ability.TextualArticulation]
};

export const NumbersPowerTenDecimalPatternExplanationViewSchema = {} as const;
export type NumbersPowerTenDecimalPatternExplanationViewConfig = ConfigFromSchema<
    typeof NumbersPowerTenDecimalPatternExplanationViewSchema
>;
