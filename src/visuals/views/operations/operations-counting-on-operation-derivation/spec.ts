import {Ability, Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'operations-counting-on-operation-derivation',
    generalLabels: [Scope.ArabicNumerals, Ability.ConceptDerivation],
    requiredLabels: [Area.AdditionCountingOn]
};

export const OperationsCountingOnOperationDerivationViewSchema = {} as const;

export type OperationsCountingOnOperationDerivationViewConfig = ConfigFromSchema<
    typeof OperationsCountingOnOperationDerivationViewSchema
>;
