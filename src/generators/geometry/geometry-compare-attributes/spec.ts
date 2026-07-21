import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {Area, Scope} from 'edugraph-ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'geometry-compare-attributes',
    generalLabels: [
        Area.ShapeRecognition,
        Area.NumericComparison,
        Scope.ShapeProperties,
        Scope.IntegerNumbers,
        Scope.Base10,
        Scope.NumbersWithoutNegatives,
        Scope.NumbersWithZero,
        Scope.NumbersLargerZero,
        Scope.NumbersSmaller10,
    ]
};


export const GeometryCompareAttributesGeneratorSchema = {
    classify: [
        [
            Area.Circle,
            Area.Triangle,
            Area.Square,
            Area.Rectangle,
            Area.Hexagon
        ],
        selectExactMatch
    ]
} as const;

export type GeometryCompareAttributesGeneratorConfig = ConfigFromSchema<typeof GeometryCompareAttributesGeneratorSchema>;
