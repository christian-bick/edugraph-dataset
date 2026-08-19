import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-partition-equivalence',
    generalLabels: [
        Area.ShapeEquivalenceRelations,
        Scope.EqualShares
    ]
};

export const ShapePartitionEquivalenceGeneratorSchema = {
    shape: [Area.Circle, Area.Rectangle]
} as const;

export type ShapePartitionEquivalenceGeneratorConfig = ConfigFromSchema<
    typeof ShapePartitionEquivalenceGeneratorSchema
>;
