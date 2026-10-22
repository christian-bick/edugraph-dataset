import type {RationalOppositeRelationProblem, SignedRational, SignedRationalContextProblem, SignedRationalLocation} from '../../../types/problems.ts';

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
function gcd(first: bigint, second: bigint): bigint {
    while (second !== 0n) [first, second] = [second, first % second];
    return first;
}
export function isSignedRational(value: unknown): value is SignedRational {
    if (!record(value) || !integer(value.numerator) || !integer(value.denominator) || value.denominator <= 0) return false;
    return gcd(BigInt(Math.abs(value.numerator)), BigInt(value.denominator)) === 1n;
}
const equal = (a: SignedRational, b: SignedRational): boolean => a.numerator === b.numerator && a.denominator === b.denominator;
const opposite = (a: SignedRational, b: SignedRational): boolean => a.numerator === -b.numerator && a.denominator === b.denominator;
const zero = (value: SignedRational): boolean => value.numerator === 0;
const sameMagnitude = (value: SignedRational, magnitude: SignedRational): boolean => magnitude.numerator === Math.abs(value.numerator) && magnitude.denominator === value.denominator;
const sign = (value: SignedRational): number => Math.sign(value.numerator);

export function formatSignedRational(value: SignedRational, explicitPositive = false): string {
    const numeral = value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`;
    return explicitPositive && value.numerator > 0 ? `+${numeral}` : numeral;
}

export function isSignedRationalContext(value: unknown): value is SignedRationalContextProblem {
    if (!record(value) || value.kind !== 'signed-rational-contexts' || !record(value.context) || !Array.isArray(value.observations) || value.observations.length === 0) return false;
    const contexts: Record<string, readonly [string, string]> = {
        temperature: ['celsius-zero', 'degrees-celsius'], elevation: ['sea-level', 'meters'],
        balance: ['settled-balance', 'dollars'], charge: ['neutral-net-charge', 'coulombs']
    };
    const expected = typeof value.context.kind === 'string' && Object.hasOwn(contexts, value.context.kind) ? contexts[value.context.kind] : undefined;
    if (!expected || value.context.reference !== expected[0] || value.context.unit !== expected[1]) return false;
    const identifiers = new Set<string>();
    return Array.from(value.observations).every(observation => {
        if (!record(observation) || typeof observation.id !== 'string' || observation.id.trim() !== observation.id || !observation.id || identifiers.has(observation.id) ||
            !isSignedRational(observation.value) || !isSignedRational(observation.magnitude) || Object.is(observation.sign, -0) || observation.sign !== sign(observation.value) || !sameMagnitude(observation.value, observation.magnitude)) return false;
        identifiers.add(observation.id);
        return true;
    });
}

export function isRationalOppositeRelation(value: unknown): value is RationalOppositeRelationProblem {
    if (!record(value) || value.kind !== 'rational-opposite-relations' || !record(value.axis)) return false;
    const axis = value.axis;
    if (!isSignedRational(axis.minimum) || !isSignedRational(axis.maximum) || !isSignedRational(axis.step) || axis.step.numerator <= 0 ||
        !Array.isArray(axis.ticks) || axis.ticks.length < 5 || axis.ticks.length > 11 || axis.ticks.length % 2 !== 1 || !Array.from(axis.ticks).every(isSignedRational) ||
        !integer(axis.zeroIndex) || axis.zeroIndex !== (axis.ticks.length - 1) / 2) return false;
    const ticks: SignedRational[] = axis.ticks;
    const step = axis.step;
    if (!equal(ticks[0]!, axis.minimum) || !equal(ticks.at(-1)!, axis.maximum) || !opposite(axis.minimum, axis.maximum) || !zero(ticks[axis.zeroIndex]!)) return false;
    if (!ticks.slice(1).every((tick, index) => {
        const previous = ticks[index]!;
        return (BigInt(tick.numerator) * BigInt(previous.denominator) - BigInt(previous.numerator) * BigInt(tick.denominator)) * BigInt(step.denominator) ===
            BigInt(step.numerator) * BigInt(tick.denominator) * BigInt(previous.denominator);
    })) return false;
    const location = (candidate: unknown): candidate is SignedRationalLocation => record(candidate) && isSignedRational(candidate.value) && isSignedRational(candidate.magnitude) &&
        integer(candidate.tickIndex) && candidate.tickIndex >= 0 && candidate.tickIndex < ticks.length && equal(candidate.value, ticks[candidate.tickIndex]!) &&
        !Object.is(candidate.sign, -0) && candidate.sign === sign(candidate.value) && sameMagnitude(candidate.value, candidate.magnitude);
    if (!location(value.original) || !location(value.opposite) || !location(value.doubleOpposite) || !opposite(value.original.value, value.opposite.value) ||
        !equal(value.original.value, value.doubleOpposite.value) || value.original.tickIndex + value.opposite.tickIndex !== 2 * axis.zeroIndex ||
        value.original.tickIndex !== value.doubleOpposite.tickIndex) return false;
    const fixed = value.zeroFixedPoint;
    if (!record(fixed) || !isSignedRational(fixed.value) || !isSignedRational(fixed.opposite) || !zero(fixed.value) || !zero(fixed.opposite) ||
        fixed.tickIndex !== axis.zeroIndex || fixed.oppositeTickIndex !== axis.zeroIndex) return false;
    const pair = value.oppositePair;
    if (!record(pair) || !location(pair.negative) || !location(pair.positive) || pair.negative.sign !== -1 || pair.positive.sign !== 1 ||
        !isSignedRational(pair.commonMagnitude) || !equal(pair.negative.magnitude, pair.commonMagnitude) || !equal(pair.positive.magnitude, pair.commonMagnitude) ||
        !opposite(pair.negative.value, pair.positive.value)) return false;
    const unequal = value.unequalSignedPair;
    return record(unequal) && location(unequal.negative) && location(unequal.positive) && unequal.negative.sign === -1 && unequal.positive.sign === 1 &&
        unequal.equalMagnitude === false && !equal(unequal.negative.magnitude, unequal.positive.magnitude);
}
