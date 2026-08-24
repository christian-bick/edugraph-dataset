import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-equal-square-partition',
    generalLabels: [
        Area.Square,
        Area.ShapeDecomposition,
        Scope.BoxArrangement,
        Scope.EqualShares
    ]
};

export const ShapeEqualSquarePartitionGeneratorSchema = {} as const;

export type ShapeEqualSquarePartitionGeneratorConfig = ConfigFromSchema<
    typeof ShapeEqualSquarePartitionGeneratorSchema
>;
