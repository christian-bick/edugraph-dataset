import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {CoordinatePointsProblem, RationalCoordinateAxes, SignedRationalNotation} from '../../../types/problems.ts';
import {makeSignedRational} from '../../number/signed-rational-helpers.ts';
import {isRationalCoordinateAxes, makeCoordinateAxis, makeCoordinatePoint} from '../coordinate-helpers.ts';
import {CoordinatePointsGeneratorSchema, type CoordinatePointsGeneratorConfig} from './spec.ts';

const generatorId = 'coordinate-points';
export type CoordinatePointParameters = {id: string; xTickIndex: number; yTickIndex: number;
    notations?: {x: SignedRationalNotation; y: SignedRationalNotation}};

/** Exact located points are independent of reading, plotting or interpreting their signs. */
export function buildCoordinatePointsProblem(axes: RationalCoordinateAxes, points: readonly CoordinatePointParameters[]): CoordinatePointsProblem {
    if (!isRationalCoordinateAxes(axes) || !Array.isArray(points) || points.length === 0) {
        throw new GeneratorValidationError(generatorId, 'A coherent exact frame and nonempty points are required.');
    }
    const identifiers = new Set<string>();
    const located = Array.from(points).map(point => {
        if (!point || typeof point !== 'object' || identifiers.has(point.id)) {
            throw new GeneratorValidationError(generatorId, 'Point records must be dense and have unique identifiers.');
        }
        identifiers.add(point.id);
        return makeCoordinatePoint(point.id, axes, point.xTickIndex, point.yTickIndex, point.notations);
    });
    return {kind: 'coordinate-points', axes, points: [located[0]!, ...located.slice(1)]};
}

const randomInteger = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const choose = <T>(values: readonly T[]): T => values[randomInteger(0, values.length - 1)]!;

function sampleAxis(numberKind: SignedRationalNotation['kind'], signed: boolean) {
    const radius = randomInteger(2, 5);
    const step = numberKind === 'integer' ? makeSignedRational(randomInteger(1, Math.floor(5 / radius)), 1)
        : makeSignedRational(1, numberKind === 'fraction' ? randomInteger(2, 4) : choose([2, 4, 5]));
    return makeCoordinateAxis(step, signed ? -radius : 0, radius, numberKind);
}

export class CoordinatePointsGenerator implements ProblemGenerator<CoordinatePointsProblem, CoordinatePointsGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = CoordinatePointsGeneratorSchema;

    generate(config: CoordinatePointsGeneratorConfig): ProblemStub<CoordinatePointsProblem> {
        validateConfigFields(generatorId, config, ['numberKind', 'signDomain', 'quadrantEvidence']);
        const {numberKind, signDomain, quadrantEvidence} = config;
        if (!['integer', 'fraction', 'decimal'].includes(numberKind!) || !['nonnegative', 'signed'].includes(signDomain!)
            || !['ordinary', 'quadrant-complete'].includes(quadrantEvidence!)) {
            throw new GeneratorValidationError(generatorId, 'Unsupported numeric form, sign domain or quadrant evidence.');
        }
        if (quadrantEvidence === 'quadrant-complete' && signDomain !== 'signed') {
            throw new GeneratorValidationError(generatorId, 'Complete quadrant evidence requires the signed domain.');
        }
        const signed = signDomain === 'signed';
        const axes = {x: sampleAxis(numberKind!, signed), y: sampleAxis(numberKind!, signed)};
        const xZero = axes.x.zeroIndex;
        const yZero = axes.y.zeroIndex;
        let positions: readonly (readonly [number, number])[];
        if (quadrantEvidence === 'quadrant-complete') {
            positions = [[xZero + 1, yZero + 1], [xZero - 1, yZero + 1], [xZero - 1, yZero - 1], [xZero + 1, yZero - 1],
                [xZero + 2, yZero], [xZero, yZero - 2], [xZero, yZero]];
        } else {
            const first = [xZero + 1, yZero + 1] as const;
            const second = signed ? [xZero - 1, yZero + 1] as const : [axes.x.ticks.length - 1, yZero] as const;
            const remaining = axes.x.ticks.flatMap((_, xIndex) => axes.y.ticks.map((_, yIndex) => [xIndex, yIndex] as const))
                .filter(([x, y]) => !(x === first[0] && y === first[1]) && !(x === second[0] && y === second[1]));
            positions = [first, second, choose(remaining)];
        }
        return {data: buildCoordinatePointsProblem(axes, positions.map(([xTickIndex, yTickIndex], index) =>
            ({id: String.fromCharCode(65 + index), xTickIndex, yTickIndex})))};
    }
}
