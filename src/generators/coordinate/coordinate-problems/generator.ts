import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {CoordinateRouteProblem, RationalCoordinateAxes, RationalCoordinateAxis, RationalCoordinatePoint, SignedRational} from '../../../types/problems.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {makeCoordinateAxis, makeCoordinatePoint} from '../coordinate-helpers.ts';
import {assertCoordinateMetricBounds, makeCoordinateMetricContext, makeCoordinateRouteEvidence} from '../coordinate-metric-helpers.ts';
import {CoordinateProblemsGeneratorSchema, type CoordinateProblemsGeneratorConfig} from './spec.ts';

const generatorId = 'coordinate-problems';
export type CoordinateRouteParameters = {
    axes: RationalCoordinateAxes;
    landmarks: readonly RationalCoordinatePoint[];
    path: readonly string[];
};

/** A supplied rectilinear route has exact per-leg distances and every cumulative prefix. */
export function buildCoordinateRouteProblem(parameters: CoordinateRouteParameters): CoordinateRouteProblem {
    if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
        throw new GeneratorValidationError(generatorId, 'A complete coordinate route is required.');
    }
    const {axes, landmarks, path} = parameters;
    const evidence = makeCoordinateRouteEvidence(axes, landmarks, path);
    return {kind: 'coordinate-problems', axes, landmarks: [landmarks[0]!, landmarks[1]!, ...landmarks.slice(2)],
        path: [path[0]!, path[1]!, ...path.slice(2)], ...evidence, context: makeCoordinateMetricContext(landmarks)};
}

const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const otherIndex = (current: number, length: number): number => {
    const candidate = integer(0, length - 2);
    return candidate >= current ? candidate + 1 : candidate;
};

function sampleAxis(base: SignedRational, radius: number): RationalCoordinateAxis {
    const step = makeSignedRational(base.numerator * integer(1, 2), base.denominator);
    return makeCoordinateAxis(step, -radius, radius, step.denominator === 1 ? 'integer' : 'fraction');
}

export class CoordinateProblemsGenerator implements ProblemGenerator<CoordinateRouteProblem, CoordinateProblemsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = CoordinateProblemsGeneratorSchema;

    generate(config: CoordinateProblemsGeneratorConfig): ProblemStub<CoordinateRouteProblem> {
        validateConfigFields(generatorId, config, ['range']);
        const {range} = config;
        if (typeof range !== 'object' || range === null || Array.isArray(range) || range.min !== 0 || Object.is(range.min, -0)
            || ![20, 100, Number.MAX_SAFE_INTEGER].includes(range.max)) {
            throw new GeneratorValidationError(generatorId, 'Range must start at zero with inclusive absolute cap20, 100 or the unbounded resolver sentinel.');
        }
        const cap = range.max === Number.MAX_SAFE_INTEGER ? 100 : range.max;
        const radius = integer(2, 3);
        const legCount = integer(2, 3);
        const denominator = integer(2, 4);
        const base = makeSignedRational(integer(1, Math.floor(cap * denominator / (4 * radius * legCount))), denominator);
        const axes = {x: sampleAxis(base, radius), y: sampleAxis(base, radius)};
        const start = makeCoordinatePoint('A', axes, integer(0, 2 * radius), integer(0, 2 * radius));
        const landmarks = [start];
        const path = [start.id];
        const firstAxis = random() < 0.5 ? 'x' : 'y';
        const revisit = legCount === 3 && random() < 0.5;
        for (let index = 0; index < legCount; index += 1) {
            if (revisit && index === 1) { path.push(start.id); continue; }
            const from = revisit && index === 2 ? start : landmarks[landmarks.length - 1]!;
            const axis = index % 2 === 0 ? firstAxis : firstAxis === 'x' ? 'y' : 'x';
            const xIndex = axis === 'x' ? otherIndex(from.x.tickIndex, axes.x.ticks.length) : from.x.tickIndex;
            const yIndex = axis === 'y' ? otherIndex(from.y.tickIndex, axes.y.ticks.length) : from.y.tickIndex;
            const point = makeCoordinatePoint(String.fromCharCode(65 + landmarks.length), axes, xIndex, yIndex);
            landmarks.push(point); path.push(point.id);
        }
        const data = buildCoordinateRouteProblem({axes, landmarks, path});
        assertCoordinateMetricBounds({axes, points: landmarks, separations: data.legs,
            additionalValues: [...data.cumulativeLengths, data.totalLength], range: cap});
        return {data};
    }
}
