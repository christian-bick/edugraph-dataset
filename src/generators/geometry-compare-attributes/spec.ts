import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-compare-attributes',
    supportedLabels: [
        Area.Circle,
        Area.Square,
        Area.Rectangle,
        Area.Triangle,
        Area.Hexagon,
        Area.Polygon
    ]
};
