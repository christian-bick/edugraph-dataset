import {Ability, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../../types/schema.ts';
import {ViewSpec} from '../../../../types/view-spec.ts';

export const spec: ViewSpec = {
    viewId: 'shape-partition-equivalence',
    generalLabels: [Ability.ConceptDerivation, Scope.ProofByConstruction]
};

export const ShapePartitionEquivalenceViewSchema = {} as const;

export type ShapePartitionEquivalenceViewConfig = ConfigFromSchema<
    typeof ShapePartitionEquivalenceViewSchema
>;
