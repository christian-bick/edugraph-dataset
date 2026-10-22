import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {CoordinateReflectionRelationProblem, CoordinateReflectionStep, FormattedSignedRationalLocation,
    RationalCoordinateAxes, RationalCoordinateAxis, SignedRationalNotation} from '../../../types/problems.ts';
import {isRationalCoordinateAxes, makeCoordinateAxis, makeCoordinateNotation, makeCoordinatePoint} from '../coordinate-helpers.ts';
import {compareSignedRationals, makeSignedRational, negateSignedRational} from '../../number/signed-rational-helpers.ts';
import {CoordinateReflectionRelationsGeneratorSchema, type CoordinateReflectionRelationsGeneratorConfig} from './spec.ts';

const generatorId = 'coordinate-reflection-relations';
type ReflectionAxis = CoordinateReflectionStep['axis'];
export type CoordinateReflectionModelParameters = {
    axes: RationalCoordinateAxes;
    xTickIndex: number;
    yTickIndex: number;
    reflectionAxes: readonly ReflectionAxis[];
};

function negatedNotation(location: FormattedSignedRationalLocation): SignedRationalNotation {
    const {notation} = location;
    if (notation.kind === 'fraction') return {...notation, numerator: notation.numerator === 0 ? 0 : -notation.numerator};
    return makeCoordinateNotation(negateSignedRational(location.value), notation.kind, notation.kind === 'decimal' ? notation.scale : 2);
}

/** Complete axis-reflection relations, including fixed points and repeated-axis involutions. */
export function buildCoordinateReflectionRelationProblem(parameters: CoordinateReflectionModelParameters): CoordinateReflectionRelationProblem {
    if (!parameters || typeof parameters !== 'object' || Array.isArray(parameters) || !isRationalCoordinateAxes(parameters.axes)) {
        throw new GeneratorValidationError(generatorId, 'Supply complete coherent exact coordinate axes.');
    }
    const {axes, xTickIndex, yTickIndex, reflectionAxes} = parameters;
    if (!Array.isArray(reflectionAxes) || reflectionAxes.length < 1 || reflectionAxes.length > 2
        || !Array.from(reflectionAxes).every(axis => axis === 'x' || axis === 'y')) {
        throw new GeneratorValidationError(generatorId, 'Supply one or two ordered x/y reflections.');
    }
    const original = makeCoordinatePoint('P', axes, xTickIndex, yTickIndex);
    let before = original;
    const steps = reflectionAxes.map((axis: ReflectionAxis, index): CoordinateReflectionStep => {
        const component = axis === 'x' ? 'y' : 'x';
        const negated = negateSignedRational(before[component].value);
        const reflectedIndex = axes[component].ticks.findIndex(tick => compareSignedRationals(tick, negated) === 0);
        if (reflectedIndex < 0) throw new GeneratorValidationError(generatorId, 'The supplied frame must contain every reflected point.');
        const notations = {x: before.x.notation, y: before.y.notation, [component]: negatedNotation(before[component])};
        const after = makeCoordinatePoint(index === 0 ? "P'" : "P''", axes,
            component === 'x' ? reflectedIndex : before.x.tickIndex,
            component === 'y' ? reflectedIndex : before.y.tickIndex, notations);
        const foot = makeCoordinatePoint(`F${index + 1}`, axes,
            axis === 'x' ? before.x.tickIndex : axes.x.zeroIndex,
            axis === 'y' ? before.y.tickIndex : axes.y.zeroIndex);
        const step: CoordinateReflectionStep = {axis, before, after,
            unchanged: {component: axis, value: {...before[axis].value}},
            negated: {component, before: {...before[component].value}, after: {...after[component].value},
                valueChanged: before[component].value.numerator !== 0},
            mirror: {foot, beforeDistance: {...before[component].magnitude}, afterDistance: {...after[component].magnitude}}};
        before = after;
        return step;
    });
    return {kind: 'coordinate-reflection-relations', axes, original,
        steps: steps.length === 1 ? [steps[0]!] : [steps[0]!, steps[1]!]};
}

const randomInteger = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const signedNonzeroOffset = (radius: number): number => randomInteger(1, radius) * (random() < 0.5 ? -1 : 1);

function sampleAxis(cap: number): RationalCoordinateAxis {
    const radius = randomInteger(2, 5);
    const step = makeSignedRational(randomInteger(1, Math.floor(cap / radius)), randomInteger(1, 4));
    return makeCoordinateAxis(step, -radius, radius, step.denominator === 1 ? 'integer' : 'fraction');
}

function sampleSourceOffsets(xRadius: number, yRadius: number): readonly [number, number] {
    const scenario = randomInteger(0, 4);
    if (scenario === 0) return [0, 0];
    if (scenario === 1) return [signedNonzeroOffset(xRadius), 0];
    if (scenario === 2) return [0, signedNonzeroOffset(yRadius)];
    if (scenario === 3) return [signedNonzeroOffset(xRadius), signedNonzeroOffset(yRadius)];
    return [random() < 0.5 ? -xRadius : xRadius, random() < 0.5 ? -yRadius : yRadius];
}

const reflectionSequences = [['x'], ['y'], ['x', 'y'], ['y', 'x']] as const;
export class CoordinateReflectionRelationsGenerator implements ProblemGenerator<CoordinateReflectionRelationProblem, CoordinateReflectionRelationsGeneratorConfig> {
    type: AbstractProblem['type'] = 'shape';
    schema = CoordinateReflectionRelationsGeneratorSchema;

    generate(config: CoordinateReflectionRelationsGeneratorConfig): ProblemStub<CoordinateReflectionRelationProblem> {
        validateConfigFields(generatorId, config, ['range']);
        const {range} = config;
        if (typeof range !== 'object' || range === null || Array.isArray(range) || range.min !== 0 || Object.is(range.min, -0)
            || ![5, 10, Number.MAX_SAFE_INTEGER].includes(range.max)) {
            throw new GeneratorValidationError(generatorId, 'Range must start at zero with inclusive absolute bound 5, 10 or the no-bound sentinel.');
        }
        const cap = range.max === Number.MAX_SAFE_INTEGER ? 10 : range.max;
        const axes = {x: sampleAxis(cap), y: sampleAxis(cap)};
        const [xOffset, yOffset] = sampleSourceOffsets(axes.x.zeroIndex, axes.y.zeroIndex);
        return {data: buildCoordinateReflectionRelationProblem({axes,
            xTickIndex: axes.x.zeroIndex + xOffset, yTickIndex: axes.y.zeroIndex + yOffset,
            reflectionAxes: reflectionSequences[randomInteger(0, reflectionSequences.length - 1)]!})};
    }
}
