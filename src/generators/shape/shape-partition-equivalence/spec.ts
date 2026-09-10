import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {partitionShape} from '../partition-schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-partition-equivalence',
    generalLabels: [
        Area.ShapeDecomposition,
        Scope.EqualShares
    ]
};

export const ShapePartitionEquivalenceGeneratorSchema = {
    shape: partitionShape
} as const;

export type ShapePartitionEquivalenceGeneratorConfig = ConfigFromSchema<
    typeof ShapePartitionEquivalenceGeneratorSchema
>;
