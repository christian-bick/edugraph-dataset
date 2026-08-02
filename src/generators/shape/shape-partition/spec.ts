import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-partition',
    generalLabels: [
        Area.FractionNotation,
        Scope.ShapeProperties
    ]
};

export const ShapePartitionGeneratorSchema = {
    shape: [Area.Circle, Area.Rectangle]
} as const;

export type ShapePartitionGeneratorConfig = ConfigFromSchema<typeof ShapePartitionGeneratorSchema>;
