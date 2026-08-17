import {Area} from 'edugraph-ts';
import {selectExactMatch} from '../../../lib/resolvers.ts';
import {GeneratorSpec} from '../../../types/generator-spec.ts';
import {ConfigFromSchema} from '../../../types/schema.ts';

export const GEOMETRY_PRIMITIVE_LABELS = [
    Area.PointConcept,
    Area.LineConcept,
    Area.LineSegment,
    Area.RayConcept,
    Area.RightAngle,
    Area.AcuteAngle,
    Area.ObtuseAngle,
    Area.PerpendicularityRelation,
    Area.ParallelismRelation
] as const;

export const spec: GeneratorSpec = {
    generatorId: 'geometry-primitives',
    generalLabels: []
};

export const GeometryPrimitivesGeneratorSchema = {
    primitive: [GEOMETRY_PRIMITIVE_LABELS, selectExactMatch]
} as const;

export type GeometryPrimitivesGeneratorConfig = ConfigFromSchema<
    typeof GeometryPrimitivesGeneratorSchema
>;
