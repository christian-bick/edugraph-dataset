import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-compare-attributes',
    generalLabels: [
        Area.ShapeIdentity,
        Area.NumericComparison,
        Scope.ShapeAttributes,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersSmaller20
    ]
};

export const ShapeCompareAttributesGeneratorSchema = {
    shape: [
        [
            Area.Triangle,
            Area.Square,
            Area.Rectangle,
            Area.Hexagon,
            Area.Circle,
            Area.Cube,
            Area.Cone,
            Area.Cylinder,
            Area.Sphere
        ],
        selectExactMatch
    ]
} as const;

export type ShapeCompareAttributesGeneratorConfig = ConfigFromSchema<typeof ShapeCompareAttributesGeneratorSchema>;
