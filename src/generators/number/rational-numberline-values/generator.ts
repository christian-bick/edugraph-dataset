import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {RationalCoordinateAxis, RationalNumberlineValuesProblem, SignedRationalNotation} from '../../../types/problems.ts';
import {isRationalCoordinateAxis, makeCoordinateAxis, makeCoordinateLocation} from '../../coordinate/coordinate-helpers.ts';
import {makeSignedRational} from '../signed-rational-helpers.ts';
import {RationalNumberlineValuesGeneratorSchema, type RationalNumberlineValuesGeneratorConfig} from './spec.ts';

const generatorId = 'rational-numberline-values';

/** One canonical location supports reading and positioning on either visual orientation. */
export function buildRationalNumberlineValuesProblem(axis: RationalCoordinateAxis, tickIndex: number,
    notation?: SignedRationalNotation): RationalNumberlineValuesProblem {
    if (!isRationalCoordinateAxis(axis) || axis.ticks.length < 3) {
        throw new GeneratorValidationError(generatorId, 'A complete exact axis with at least three ticks is required.');
    }
    return {kind: 'rational-numberline-values', axis, point: makeCoordinateLocation(axis, tickIndex, notation)};
}

const integer = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));
const choose = <T>(values: readonly T[]): T => values[integer(0, values.length - 1)]!;

export class RationalNumberlineValuesGenerator implements ProblemGenerator<RationalNumberlineValuesProblem, RationalNumberlineValuesGeneratorConfig> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = RationalNumberlineValuesGeneratorSchema;

    generate(config: RationalNumberlineValuesGeneratorConfig): ProblemStub<RationalNumberlineValuesProblem> {
        validateConfigFields(generatorId, config, ['numberKind', 'signDomain']);
        const {numberKind, signDomain} = config;
        if (!['integer', 'fraction', 'decimal'].includes(numberKind!) || !['nonnegative', 'signed'].includes(signDomain!)) {
            throw new GeneratorValidationError(generatorId, 'An exact numeric form and sign domain are required.');
        }
        const signed = signDomain === 'signed';
        const radius = integer(2, 5);
        const denominator = numberKind === 'fraction' ? choose([2, 3, 4, 6, 8])
            : numberKind === 'decimal' ? choose([2, 4, 10]) : 1;
        const step = makeSignedRational(numberKind === 'integer' ? integer(1, 3) : 1, denominator);
        const axis = makeCoordinateAxis(step, signed ? -radius : 0, radius, numberKind!, choose([2, 3]));
        const tickIndex = signed ? integer(0, radius - 1) : integer(0, radius);
        const notation: SignedRationalNotation | undefined = numberKind === 'fraction'
            ? {kind: 'fraction', numerator: tickIndex - axis.zeroIndex, denominator} : undefined;
        return {data: buildRationalNumberlineValuesProblem(axis, tickIndex, notation)};
    }
}
