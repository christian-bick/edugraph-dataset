import {Ability, Scope} from 'edugraph-ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-power-ten-zero-pattern-explanation',
    generalLabels: [Scope.ArabicNumerals, Ability.ProcedureUnderstanding, Ability.TextualArticulation]
};

export const NumbersPowerTenZeroPatternExplanationViewSchema = {} as const;
export type NumbersPowerTenZeroPatternExplanationViewConfig = ConfigFromSchema<
    typeof NumbersPowerTenZeroPatternExplanationViewSchema
>;
