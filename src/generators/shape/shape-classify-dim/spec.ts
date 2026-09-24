import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-classify-dim',
    compatibility: [generatorLabelRule('shape-dimension', [
        Area.Circle, Area.Square, Area.Rectangle, Area.Triangle, Area.Hexagon,
        Area.Cube, Area.Cone, Area.Cylinder, Area.Sphere, Scope.TwoDimensional, Scope.ThreeDimensional
    ], selected => {
        const plane = [Area.Circle, Area.Square, Area.Rectangle, Area.Triangle, Area.Hexagon].some(selected);
        const solid = [Area.Cube, Area.Cone, Area.Cylinder, Area.Sphere].some(selected);
        return plane && selected(Scope.TwoDimensional) || solid && selected(Scope.ThreeDimensional);
    })],
    generalLabels: [
        Area.ShapeClassification,
        Scope.ShapeProperties
    ]
};


export const ShapeClassifyDimGeneratorSchema = {
    classify: [
        [
            Area.Circle,
            Area.Square,
            Area.Rectangle,
            Area.Triangle,
            Area.Hexagon,
            Area.Cube,
            Area.Cone,
            Area.Cylinder,
            Area.Sphere
        ],
        selectExactMatch
    ],
    dimension: [
        [Scope.TwoDimensional, Scope.ThreeDimensional],
        selectExactMatch
    ]
} as const;

export type ShapeClassifyDimGeneratorConfig = ConfigFromSchema<typeof ShapeClassifyDimGeneratorSchema>;
