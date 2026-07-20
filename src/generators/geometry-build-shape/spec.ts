import {GeneratorSpec} from '../../types/generator-spec.ts';
import {Area} from 'edugraph-ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-build-shape',
    supportedLabels: [
        Area.Triangle,
        Area.Square,
        Area.Hexagon,
        Area.Rectangle,
        Area.ShapePlotting
    ]
};
