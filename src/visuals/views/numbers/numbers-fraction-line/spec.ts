import {Ability, Scope} from 'edugraph-ts';
import {matchAllExactLabels} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'numbers-fraction-line',
    generalLabels: [
        Scope.Numberline,
        Scope.SingleFrameOfReference
    ]
};

export const NumbersFractionLineViewSchema = {
    taskAbilities: [[
        Ability.ConceptClassification,
        Ability.Formalization,
        Ability.ProcedureUnderstanding,
        Ability.VisualArticulation
    ], matchAllExactLabels]
} as const;

export type NumbersFractionLineViewConfig = ConfigFromSchema<
    typeof NumbersFractionLineViewSchema
>;
