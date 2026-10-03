import {Ability, Scope} from 'edugraph-ts';
import {requireTargetLabels} from '../../../../lib/target-policies.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'fractions-word-problem',
    generalLabels: [
        Ability.TextualReception,
        Scope.VisualNumbers,
        Ability.ProcedureExecution
    ],
    compatibility: [requireTargetLabels('fraction-arithmetic-word-request', [Ability.TextualReception])]
};

export const FractionsWordProblemViewSchema = {} as const;

export type FractionsWordProblemViewConfig = ConfigFromSchema<
    typeof FractionsWordProblemViewSchema
>;
