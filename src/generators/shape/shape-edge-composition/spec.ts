import {Area, Scope} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-edge-composition',
    generalLabels: [Area.ShapeSynthesis, Scope.ShapeAttributes]
};

export const ShapeEdgeCompositionGeneratorSchema = {
    shape: [[Area.Triangle, Area.Square, Area.Rectangle, Area.Hexagon], selectExactLabelMap([
        [Area.Triangle, 'triangle'],
        [Area.Square, 'square'],
        [Area.Rectangle, 'rectangle'],
        [Area.Hexagon, 'hexagon']
    ] as const)]
} as const;

export type ShapeEdgeCompositionGeneratorConfig = ConfigFromSchema<typeof ShapeEdgeCompositionGeneratorSchema>;
