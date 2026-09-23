import {Area} from 'edugraph-ts';
import {selectExactLabelMap} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const spec: GeneratorSpec = {generatorId: 'shape-build-shape', generalLabels: []};
const resolveShape = selectExactLabelMap([
    [Area.Triangle, 'triangle'], [Area.Square, 'square'], [Area.Rectangle, 'rectangle'],
    [Area.Quadrilateral, 'quadrilateral'], [Area.Pentagon, 'pentagon'], [Area.Hexagon, 'hexagon']
] as const);
export const ShapeBuildShapeGeneratorSchema = {
    shape: [[Area.Triangle, Area.Square, Area.Rectangle, Area.Quadrilateral, Area.Pentagon, Area.Hexagon], resolveShape]
} as const;
export type ShapeBuildShapeGeneratorConfig = ConfigFromSchema<typeof ShapeBuildShapeGeneratorSchema>;
