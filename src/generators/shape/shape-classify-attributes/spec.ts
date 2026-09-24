import {Area, Scope} from 'edugraph-ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';
import {hasLabel, matchAllExactLabels} from '../../../lib/resolvers.ts';

import {generatorLabelRule} from '../../compatibility-rules.ts';

export const spec: GeneratorSpec = {
    generatorId: 'shape-classify-attributes',
    compatibility: [generatorLabelRule('shape-classification-criterion', [
        Area.ShapeSubsumption, Area.Rhombus, Area.Rectangle, Area.Square, Area.RightTriangle,
        Area.ParallelismRelation, Area.PerpendicularityRelation, Area.RightAngle, Area.AcuteAngle, Area.ObtuseAngle,
        Scope.VertexCount, Scope.AngleCount, Scope.FaceCount, Scope.Equal
    ], selected => {
        const criteria = [Area.ParallelismRelation, Area.PerpendicularityRelation,
            Area.RightAngle, Area.AcuteAngle, Area.ObtuseAngle].filter(selected);
        if (criteria.length > 1) return false;
        const vertices = selected(Scope.VertexCount);
        const angles = selected(Scope.AngleCount);
        const faces = selected(Scope.FaceCount);
        const equal = selected(Scope.Equal);
        if ((vertices !== angles) && !faces && !equal) return true;
        if (!vertices && faces && equal) return true;
        if (vertices || angles || faces || equal) return false;
        if (!selected(Area.ShapeSubsumption)) return true;
        if (criteria.length) return selected(Area.RightAngle) && selected(Area.RightTriangle);
        return [Area.Rhombus, Area.Rectangle, Area.Square].some(selected);
    })],
    generalLabels: [Area.ShapeClassification]
};

export const ShapeClassifyAttributesGeneratorSchema = {
    shapeAttributes: [
        [Scope.ShapeAttributes],
        hasLabel(Scope.ShapeAttributes),
        [[Scope.ShapeAttributes]]
    ],
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
        [Scope.VertexCount, Scope.AngleCount, Scope.FaceCount, Scope.Equal],
        matchAllExactLabels
    ]
} as const;

export type ShapeClassifyAttributesGeneratorConfig = ConfigFromSchema<
    typeof ShapeClassifyAttributesGeneratorSchema
>;
