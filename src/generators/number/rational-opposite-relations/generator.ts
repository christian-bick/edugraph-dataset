import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import type {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import type {RationalOppositeRelationProblem, SignedRational, SignedRationalLocation} from '../../../types/problems.ts';
import {absoluteSignedRational, isCanonicalSignedRational, makeSignedRational, negateSignedRational} from '../signed-rational-helpers.ts';
import {RationalOppositeRelationsGeneratorSchema, type RationalOppositeRelationsGeneratorConfig} from './spec.ts';

const generatorId = 'rational-opposite-relations';
const integerWithin = (value: number, minimum: number, maximum: number): boolean => Number.isSafeInteger(value)
    && value >= minimum && value <= maximum && !Object.is(value, -0);

export type RationalOppositeModelParameters = {
    step: SignedRational;
    radiusTicks: number;
    originalTick: number;
    oppositeMagnitudeTick: number;
    unequalMagnitudeTicks: readonly [number, number];
};

/** Build the complete exact relation on a bounded lattice, independently of the selected primary domain. */
export function buildRationalOppositeRelationProblem(parameters: RationalOppositeModelParameters): RationalOppositeRelationProblem {
    if (!parameters || typeof parameters !== 'object') {
        throw new GeneratorValidationError(generatorId, 'Mathematical model parameters are required.');
    }
    const {step, radiusTicks, originalTick, oppositeMagnitudeTick, unequalMagnitudeTicks} = parameters;
    if (!isCanonicalSignedRational(step) || step.numerator <= 0 || !integerWithin(radiusTicks, 2, 5)
        || !Number.isSafeInteger(step.numerator * radiusTicks)) {
        throw new GeneratorValidationError(generatorId, 'A canonical positive step and safe radius from 2 through 5 are required.');
    }
    if (!integerWithin(originalTick, -radiusTicks, radiusTicks) || !integerWithin(oppositeMagnitudeTick, 1, radiusTicks)
        || !Array.isArray(unequalMagnitudeTicks) || unequalMagnitudeTicks.length !== 2
        || !Array.from(unequalMagnitudeTicks).every(value => integerWithin(value, 1, radiusTicks))
        || unequalMagnitudeTicks[0] === unequalMagnitudeTicks[1]) {
        throw new GeneratorValidationError(generatorId, 'Locations must be exact lattice ticks, with distinct nonzero unequal magnitudes.');
    }
    const ticks = Array.from({length: 2 * radiusTicks + 1}, (_, index) =>
        makeSignedRational((index - radiusTicks) * step.numerator, step.denominator));
    const location = (offset: number): SignedRationalLocation => {
        const value = ticks[radiusTicks + offset]!;
        return {value, tickIndex: radiusTicks + offset, sign: Math.sign(value.numerator) as -1 | 0 | 1,
            magnitude: absoluteSignedRational(value)};
    };
    const zero = location(0);
    const positiveOpposite = location(oppositeMagnitudeTick);
    return {
        kind: 'rational-opposite-relations',
        axis: {minimum: ticks[0]!, maximum: ticks[ticks.length - 1]!, step, ticks, zeroIndex: radiusTicks},
        original: location(originalTick), opposite: location(-originalTick), doubleOpposite: location(originalTick),
        zeroFixedPoint: {value: zero.value, opposite: negateSignedRational(zero.value),
            tickIndex: zero.tickIndex, oppositeTickIndex: zero.tickIndex},
        oppositePair: {negative: location(-oppositeMagnitudeTick), positive: positiveOpposite,
            commonMagnitude: positiveOpposite.magnitude},
        unequalSignedPair: {negative: location(-unequalMagnitudeTicks[0]), positive: location(unequalMagnitudeTicks[1]), equalMagnitude: false}
    };
}

const randomInteger = (minimum: number, maximum: number): number => minimum + Math.floor(random() * (maximum - minimum + 1));

export class RationalOppositeRelationsGenerator implements ProblemGenerator<
    RationalOppositeRelationProblem, RationalOppositeRelationsGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = RationalOppositeRelationsGeneratorSchema;

    generate(config: RationalOppositeRelationsGeneratorConfig): ProblemStub<RationalOppositeRelationProblem> {
        validateConfigFields(generatorId, config, ['relation', 'range']);
        const {relation, range} = config;
        if (!['iterated-negation', 'nonzero-opposition', 'zero-fixed-point'].includes(relation!)) {
            throw new GeneratorValidationError(generatorId, 'Unsupported mathematical relation.');
        }
        if (typeof range !== 'object' || range === null || Array.isArray(range) || range.min !== 0 || Object.is(range.min, -0)
            || ![5, 10, Number.MAX_SAFE_INTEGER].includes(range.max)) {
            throw new GeneratorValidationError(generatorId, 'Range must start at zero with inclusive absolute bound 5, 10, or the unbounded resolver sentinel.');
        }
        const cap = range.max === Number.MAX_SAFE_INTEGER ? 10 : range.max;
        const radiusTicks = randomInteger(2, 5);
        const step = makeSignedRational(randomInteger(1, Math.floor(cap / radiusTicks)), randomInteger(1, 2));
        const originalTick = relation === 'zero-fixed-point' ? 0 : relation === 'iterated-negation'
            ? randomInteger(-radiusTicks, radiusTicks) : randomInteger(1, radiusTicks) * (random() < 0.5 ? -1 : 1);
        const firstMagnitude = randomInteger(1, radiusTicks);
        const secondChoice = randomInteger(1, radiusTicks - 1);
        const secondMagnitude = secondChoice >= firstMagnitude ? secondChoice + 1 : secondChoice;
        return {data: buildRationalOppositeRelationProblem({step, radiusTicks, originalTick,
            oppositeMagnitudeTick: randomInteger(1, radiusTicks), unequalMagnitudeTicks: [firstMagnitude, secondMagnitude]})};
    }
}
