import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-compose-shapes',
    generalLabels: [
        Area.ShapeSynthesis
    ]
};


export const ShapeComposeShapesGeneratorSchema = {
    classify: [
        [
            Area.Rectangle,
            Area.Square,
            Area.Triangle,
            Area.Hexagon,
            Area.Trapezoid,
            Area.HalfCircle,
            Area.QuarterCircle,
            Area.Cube,
            Area.RectangularPrism,
            Area.Cone,
            Area.Cylinder
        ],
        selectExactMatch
    ],
    compositionStructure: [
        [Scope.SingleLevelComposition, Scope.MultiLevelComposition],
        selectExactMatch
    ]
} as const;

export type ShapeComposeShapesGeneratorConfig = ConfigFromSchema<typeof ShapeComposeShapesGeneratorSchema>;
