import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {hasLabel, matchAllExactLabels} from '../../../lib/resolvers.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-classify-attributes',
    generalLabels: [Area.ShapeClassification]
};

export const ShapeClassifyAttributesGeneratorSchema = {
    subsumption: [
        [Area.ShapeSubsumption],
        hasLabel(Area.ShapeSubsumption)
    ],
    shapes: [
        [
            Area.Triangle,
            Area.Rhombus,
            Area.Rectangle,
            Area.Square,
            Area.Quadrilateral,
            Area.Pentagon,
            Area.Hexagon,
            Area.Cube,
            Area.RightTriangle
        ],
        matchAllExactLabels
    ],
    criteria: [
        [
            Area.ParallelismRelation,
            Area.PerpendicularityRelation,
            Area.RightAngle,
            Area.AcuteAngle,
            Area.ObtuseAngle
        ],
        matchAllExactLabels
    ],
    attributeCounts: [
        [Scope.VertexCount, Scope.FaceCount, Scope.Equal],
        matchAllExactLabels
    ]
} as const;

export type ShapeClassifyAttributesGeneratorConfig = ConfigFromSchema<
    typeof ShapeClassifyAttributesGeneratorSchema
>;
