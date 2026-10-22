import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {CoordinatePolygonProblem, CoordinatePolygonSideDistanceEquation, RationalCoordinateAxes, RationalCoordinatePoint} from '../../../types/problems.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {isRationalCoordinateAxes, isRationalCoordinatePoint, makeCoordinateAxis, makeCoordinatePoint} from '../coordinate-helpers.ts';
import {assertCoordinateMetricBounds, makeCoordinateAlignedSeparation, makeCoordinateMetricContext} from '../coordinate-metric-helpers.ts';
import {isSimpleCoordinatePolygon} from '../polygon-geometry-helpers.ts';
import {CoordinatePolygonsGeneratorSchema, type CoordinatePolygonsGeneratorConfig} from './spec.ts';

const generatorId = 'coordinate-polygons';

/** Full closed geometry and a genuine optional subset of coordinate-distance equations. */
export function buildCoordinatePolygonProblem(axes: RationalCoordinateAxes, vertices: readonly RationalCoordinatePoint[],
    distanceProofEdgeIndices: readonly number[]): CoordinatePolygonProblem {
    if (!isRationalCoordinateAxes(axes) || !Array.isArray(vertices) || vertices.length < 3
        || !Array.from(vertices).every(vertex => isRationalCoordinatePoint(vertex, axes))
        || new Set(vertices.map(vertex => vertex.id)).size !== vertices.length
        || !isSimpleCoordinatePolygon(vertices.map(vertex => ({x: vertex.x.value, y: vertex.y.value})))) {
        throw new GeneratorValidationError(generatorId, 'Supply a coherent exact frame and unique vertices of a simple noncollinear polygon.');
    }
    const edges = vertices.map((vertex, index) => ({fromId: vertex.id, toId: vertices[(index + 1) % vertices.length]!.id}));
    const alignedSides = vertices.flatMap((vertex, edgeIndex) => {
        const next = vertices[(edgeIndex + 1) % vertices.length]!;
        return vertex.x.tickIndex === next.x.tickIndex || vertex.y.tickIndex === next.y.tickIndex
            ? [{edgeIndex, separation: makeCoordinateAlignedSeparation(vertex, next)}] : [];
    });
    if (alignedSides.length === 0) throw new GeneratorValidationError(generatorId, 'At least one boundary edge must be coordinate-aligned.');
    if (!Array.isArray(distanceProofEdgeIndices) || !Array.from(distanceProofEdgeIndices).every((edgeIndex, index) =>
        Number.isSafeInteger(edgeIndex) && !Object.is(edgeIndex, -0) && (index === 0 || edgeIndex > distanceProofEdgeIndices[index - 1]!)
        && alignedSides.some(side => side.edgeIndex === edgeIndex))) {
        throw new GeneratorValidationError(generatorId, 'Proof edge indices must be a dense increasing subset of coordinate-aligned boundary edges.');
    }
    const sideDistanceEquations: CoordinatePolygonSideDistanceEquation[] = distanceProofEdgeIndices.map(edgeIndex => {
        const {separation} = alignedSides.find(side => side.edgeIndex === edgeIndex)!;
        return {edgeIndex, minuend: {...separation.upper}, subtrahend: {...separation.lower}, difference: {...separation.distance}};
    });
    return {kind: 'coordinate-polygons', axes, vertices: [vertices[0]!, vertices[1]!, vertices[2]!, ...vertices.slice(3)],
        edges: [edges[0]!, edges[1]!, edges[2]!, ...edges.slice(3)],
        alignedSides: [alignedSides[0]!, ...alignedSides.slice(1)], sideDistanceEquations,
        context: makeCoordinateMetricContext(vertices, vertices.map(() => 'corner'))};
}

const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const templates = [
    [[0, 0], [4, 0], [4, 3], [0, 3]],
    [[0, 0], [4, 0], [0, 3]],
    [[0, 0], [4, 0], [3, 3], [1, 3]],
    [[0, 0], [3, 0], [4, 2], [2, 4], [0, 3]],
    [[0, 0], [4, 0], [4, 1], [1, 1], [1, 4], [0, 4]],
    [[0, 0], [4, 0], [4, 4], [2, 2], [0, 4]]
] as const;

function magnitudeLimit(range: unknown): number {
    if (typeof range !== 'object' || range === null || Array.isArray(range)) throw new GeneratorValidationError(generatorId, 'A mathematical magnitude range is required.');
    const {min, max} = range as {min: unknown; max: unknown};
    if (min !== 0 || Object.is(min, -0) || (max !== 20 && max !== 100 && max !== Number.MAX_SAFE_INTEGER)) {
        throw new GeneratorValidationError(generatorId, 'Range must have minimum0 and maximum20,100 or the explicit unbounded sentinel.');
    }
    return max === Number.MAX_SAFE_INTEGER ? 100 : max;
}

export class CoordinatePolygonsGenerator implements ProblemGenerator<CoordinatePolygonProblem, CoordinatePolygonsGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = CoordinatePolygonsGeneratorSchema;

    generate(config: CoordinatePolygonsGeneratorConfig): ProblemStub<CoordinatePolygonProblem> {
        validateConfigFields(generatorId, config, ['signDomain', 'distanceEvidence', 'range']);
        if ((config.signDomain !== 'nonnegative' && config.signDomain !== 'signed')
            || (config.distanceEvidence !== 'geometry-only' && config.distanceEvidence !== 'side-equations')) {
            throw new GeneratorValidationError(generatorId, 'Unsupported sign domain or distance-equation evidence.');
        }
        const maximum = magnitudeLimit(config.range);
        const signed = config.signDomain === 'signed';
        const baseStep = makeSignedRational(integer(1, Math.floor(maximum / 12)), integer(1, 4));
        const axis = () => {
            const step = makeSignedRational(baseStep.numerator * integer(1, 2), baseStep.denominator);
            return makeCoordinateAxis(step, signed ? -3 : 0, signed ? 3 : 5, step.denominator === 1 ? 'integer' : 'fraction');
        };
        const axes = {x: axis(), y: axis()};
        const template = templates[integer(0, templates.length - 1)]!;
        const positions = random() < 0.5 ? [...template] : [...template].reverse();
        const offset = signed ? -2 : 0;
        const vertices = positions.map(([x, y], index) => makeCoordinatePoint(String.fromCharCode(65 + index), axes,
            axes.x.zeroIndex + x + offset, axes.y.zeroIndex + y + offset));
        const geometry = buildCoordinatePolygonProblem(axes, vertices, []);
        const data = config.distanceEvidence === 'geometry-only' ? geometry
            : buildCoordinatePolygonProblem(axes, vertices, [geometry.alignedSides[0].edgeIndex]);
        assertCoordinateMetricBounds({axes, points: vertices, separations: data.alignedSides.map(side => side.separation),
            additionalValues: data.sideDistanceEquations.flatMap(proof => [proof.minuend, proof.subtrahend, proof.difference]),
            range: maximum, signDomain: config.signDomain});
        return {data};
    }
}
