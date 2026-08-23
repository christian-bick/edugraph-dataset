import {Area} from 'edugraph-ts';
import {validateConfigFields} from '../../../lib/errors.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {GeometryPrimitiveKind, GeometryPrimitivesProblem} from '../../../types/problems.ts';
import {
    GeometryPrimitivesGeneratorConfig,
    GeometryPrimitivesGeneratorSchema
} from './spec.ts';

type PrimitiveLabel = GeometryPrimitivesGeneratorConfig['primitive'];

const PRIMITIVE_KINDS = new Map<PrimitiveLabel, GeometryPrimitiveKind>([
    [Area.PointConcept, 'point'],
    [Area.LineConcept, 'line'],
    [Area.LineSegment, 'line-segment'],
    [Area.RayConcept, 'ray'],
    [Area.RightAngle, 'right-angle'],
    [Area.AcuteAngle, 'acute-angle'],
    [Area.ObtuseAngle, 'obtuse-angle'],
    [Area.PerpendicularityRelation, 'perpendicular-lines'],
    [Area.ParallelismRelation, 'parallel-lines']
]);

export class GeometryPrimitivesGenerator implements ProblemGenerator<
    GeometryPrimitivesProblem,
    GeometryPrimitivesGeneratorConfig
> {
    type: AbstractProblem['type'] = 'shape';
    schema = GeometryPrimitivesGeneratorSchema;

    generate(config: GeometryPrimitivesGeneratorConfig): ProblemStub<GeometryPrimitivesProblem> | null {
        validateConfigFields('geometry-primitives', config, ['primitive']);
        const primitiveKind = PRIMITIVE_KINDS.get(config.primitive);
        return primitiveKind ? {data: {primitiveKind}} : null;
    }
}
