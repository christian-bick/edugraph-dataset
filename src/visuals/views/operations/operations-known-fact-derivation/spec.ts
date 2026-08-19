import {Ability} from 'edugraph-ts';
import {matchAllExactLabels} from '../../../../lib/resolvers.ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-known-fact-derivation',
    generalLabels: []
};

export const OperationsKnownFactDerivationViewSchema = {
    taskAbilities: [[
        Ability.ProcedureUnderstanding,
        Ability.ProcedureInversion
    ], matchAllExactLabels]
} as const;

export type OperationsKnownFactDerivationViewConfig = ConfigFromSchema<
    typeof OperationsKnownFactDerivationViewSchema
>;
