import {Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {partitionParts, partitionShape} from '../partition-schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-partition',
    generalLabels: [Scope.EqualShares, Scope.UnitFractions]
};

export const ShapePartitionGeneratorSchema = {
    shape: partitionShape,
    parts: partitionParts
} as const;

export type ShapePartitionGeneratorConfig = ConfigFromSchema<typeof ShapePartitionGeneratorSchema>;
