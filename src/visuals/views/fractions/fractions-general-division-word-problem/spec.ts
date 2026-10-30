import {Ability, Area, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-general-division-word-problem',
    generalLabels: [Ability.TextualReception, Ability.ProcedureExecution, Scope.ArabicNumerals, Scope.Base10,
        Scope.Numberline, Scope.BarModel],
    compatibility: [requireTargetLabels('fraction-general-division-contextual-equation', [Area.Equation])]
};

export const FractionsGeneralDivisionWordProblemViewSchema = {} as const;
export type FractionsGeneralDivisionWordProblemViewConfig = ConfigFromSchema<typeof FractionsGeneralDivisionWordProblemViewSchema>;
