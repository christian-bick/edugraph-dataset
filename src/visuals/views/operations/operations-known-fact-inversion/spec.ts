import {Ability} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-known-fact-inversion',
    generalLabels: [
        Ability.ProcedureInversion
    ]
};

export const OperationsKnownFactInversionViewSchema = {} as const;

export type OperationsKnownFactInversionViewConfig = ConfigFromSchema<
    typeof OperationsKnownFactInversionViewSchema
>;
