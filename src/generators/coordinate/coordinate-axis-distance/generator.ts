import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {CoordinateAxisDistanceProblem, RationalCoordinateAxes, RationalCoordinateAxis, RationalCoordinatePoint, SignedRational} from '../../../types/problems.ts';
import {makeCoordinateAxis, makeCoordinatePoint} from '../coordinate-helpers.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {assertCoordinateMetricBounds, makeCoordinateAbsoluteDifference, makeCoordinateAlignedSeparation, makeCoordinateMetricContext} from '../coordinate-metric-helpers.ts';
import {CoordinateAxisDistanceGeneratorSchema, type CoordinateAxisDistanceGeneratorConfig} from './spec.ts';

const generatorId = 'coordinate-axis-distance';
export type CoordinateAxisDistanceParameters = {
    axes: RationalCoordinateAxes;
    first: RationalCoordinatePoint;
    second: RationalCoordinatePoint;
    varyingAxis?: 'x' | 'y';
    subtractionOrder?: 'upper-lower' | 'to-from';
};

/** Both subtraction orientations prove the same exact nonnegative separation. */
export function buildCoordinateAxisDistanceProblem(parameters: CoordinateAxisDistanceParameters): CoordinateAxisDistanceProblem {
    if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters)) {
        throw new GeneratorValidationError(generatorId, 'A complete coordinate-distance relation is required.');
    }
    const {axes, first, second, varyingAxis, subtractionOrder} = parameters;
    assertCoordinateMetricBounds({axes, points: [first, second], range: Number.MAX_SAFE_INTEGER});
    const separation = makeCoordinateAlignedSeparation(first, second, varyingAxis);
    const absoluteDifference = makeCoordinateAbsoluteDifference(separation, subtractionOrder);
    return {kind: 'coordinate-axis-distance', axes, first, second, separation, absoluteDifference,
        context: makeCoordinateMetricContext([first, second])};
}

const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));

function sampleAxis(base: SignedRational, radius: number): RationalCoordinateAxis {
    const step = makeSignedRational(base.numerator * integer(1, 2), base.denominator);
    return makeCoordinateAxis(step, -radius, radius, step.denominator === 1 ? 'integer' : 'fraction');
}

function varyingIndices(axis: RationalCoordinateAxis): readonly [number, number] {
    const scenario = integer(0, 3);
    const last = axis.ticks.length - 1;
    if (scenario === 0) { const index = integer(0, last); return [index, index]; }
    if (scenario === 1) return [0, last];
    if (scenario === 2) return [integer(0, axis.zeroIndex - 1), integer(axis.zeroIndex + 1, last)];
    return [integer(0, last), integer(0, last)];
}

export class CoordinateAxisDistanceGenerator implements ProblemGenerator<CoordinateAxisDistanceProblem, CoordinateAxisDistanceGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = CoordinateAxisDistanceGeneratorSchema;

    generate(config: CoordinateAxisDistanceGeneratorConfig): ProblemStub<CoordinateAxisDistanceProblem> {
        validateConfigFields(generatorId, config, ['range']);
        const {range} = config;
        if (typeof range !== 'object' || range === null || Array.isArray(range) || range.min !== 0 || Object.is(range.min, -0)
            || ![20, 100, Number.MAX_SAFE_INTEGER].includes(range.max)) {
            throw new GeneratorValidationError(generatorId, 'Range must start at zero with inclusive absolute cap20, 100 or the unbounded resolver sentinel.');
        }
        const cap = range.max === Number.MAX_SAFE_INTEGER ? 100 : range.max;
        const xRadius = integer(2, 5);
        const yRadius = integer(2, 5);
        const denominator = integer(1, 4);
        const base = makeSignedRational(integer(1, Math.floor(cap * denominator / (4 * Math.max(xRadius, yRadius)))), denominator);
        const axes = {x: sampleAxis(base, xRadius), y: sampleAxis(base, yRadius)};
        const axis = random() < 0.5 ? 'x' : 'y';
        const fixed = axis === 'x' ? 'y' : 'x';
        const indices = varyingIndices(axes[axis]);
        const [from, to] = random() < 0.5 ? indices : [indices[1], indices[0]];
        const fixedIndex = integer(0, axes[fixed].ticks.length - 1);
        const first = makeCoordinatePoint('A', axes, axis === 'x' ? from! : fixedIndex, axis === 'y' ? from! : fixedIndex);
        const second = makeCoordinatePoint('B', axes, axis === 'x' ? to! : fixedIndex, axis === 'y' ? to! : fixedIndex);
        const data = buildCoordinateAxisDistanceProblem({axes, first, second, varyingAxis: axis,
            subtractionOrder: random() < 0.5 ? 'upper-lower' : 'to-from'});
        assertCoordinateMetricBounds({axes, points: [first, second], separations: [data.separation],
            additionalValues: Object.values(data.absoluteDifference), range: cap});
        return {data};
    }
}
