import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-known-fact-derivation',
    generalLabels: []
};

export const OperationsKnownFactDerivationViewSchema = {} as const;

export type OperationsKnownFactDerivationViewConfig = ConfigFromSchema<
    typeof OperationsKnownFactDerivationViewSchema
>;
