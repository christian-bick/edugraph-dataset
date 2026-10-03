import {Ability, Area} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import type {ConfigFromSchema} from '../../../../types/schema.ts';
import type {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-division-word-problem',
    generalLabels: [Ability.TextualReception, Ability.ProcedureExecution],
    compatibility: [requireTargetLabels('fraction-division-contextual-equation', [Area.Equation])]
};

export const FractionsDivisionWordProblemViewSchema = {} as const;
export type FractionsDivisionWordProblemViewConfig = ConfigFromSchema<typeof FractionsDivisionWordProblemViewSchema>;
