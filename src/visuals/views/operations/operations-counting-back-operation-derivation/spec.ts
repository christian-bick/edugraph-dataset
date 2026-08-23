import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-counting-back-operation-derivation',
    generalLabels: [Scope.ArabicNumerals, Ability.ConceptDerivation],
    requiredLabels: [Area.SubtractionCountingBack]
};

export const OperationsCountingBackOperationDerivationViewSchema = {} as const;

export type OperationsCountingBackOperationDerivationViewConfig = ConfigFromSchema<
    typeof OperationsCountingBackOperationDerivationViewSchema
>;
