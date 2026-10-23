import {Area} from 'edugraph-ts';
import {selectExactLabelSetMap} from '../../../lib/resolvers.ts';
import type {GeneratorSpec} from '../../../types/generator-spec.ts';
import type {ConfigFromSchema} from '../../../types/schema.ts';

const families = [
    [[Area.RightTriangle, Area.ShapeSynthesis], 'right-triangle'],
    [[Area.AcuteTriangle, Area.ShapeDecomposition], 'acute-triangle'],
    [[Area.ObtuseTriangle, Area.ShapeDecomposition], 'obtuse-triangle'],
    [[Area.Parallelogram, Area.ShapeSynthesis], 'parallelogram'],
    [[Area.Rhombus, Area.ShapeDecomposition], 'rhombus'],
    [[Area.Trapezoid, Area.ShapeDecomposition], 'trapezoid'],
    [[Area.Kite, Area.ShapeDecomposition], 'kite'],
    [[Area.Polygon, Area.ShapeDecomposition], 'polygon']
] as const;

export const spec: GeneratorSpec = {generatorId: 'polygon-area-dissection', generalLabels: [Area.AreaCalculation]};
export const PolygonAreaDissectionGeneratorSchema = {
    family: [[...new Set(families.flatMap(([labels]) => labels))], selectExactLabelSetMap(families), families.map(([labels]) => labels)]
} as const;
export type PolygonAreaDissectionGeneratorConfig = ConfigFromSchema<typeof PolygonAreaDissectionGeneratorSchema>;
