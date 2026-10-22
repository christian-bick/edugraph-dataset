import {GeneratorValidationError} from '../../lib/errors.ts';
import type {SignedRational, SignedRationalAxis, SignedRationalLocation} from '../../types/problems.ts';
import {absoluteSignedRational, isCanonicalSignedRational, makeSignedRational} from './signed-rational-helpers.ts';

const helperId = 'signed-rational-axis';
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
const same = (first: SignedRational, second: SignedRational): boolean => first.numerator === second.numerator && first.denominator === second.denominator;

/** Complete increasing exact scale containing zero, without a sampler-only symmetry or tick-count cap. */
export function isSignedRationalAxis(value: unknown): value is SignedRationalAxis {
    if (!record(value) || !isCanonicalSignedRational(value.minimum) || !isCanonicalSignedRational(value.maximum)
        || !isCanonicalSignedRational(value.step) || value.step.numerator <= 0
        || !Array.isArray(value.ticks) || value.ticks.length < 2 || !Array.from(value.ticks).every(isCanonicalSignedRational)
        || !integer(value.zeroIndex) || value.zeroIndex < 0 || value.zeroIndex >= value.ticks.length) return false;
    const ticks: SignedRational[] = value.ticks;
    if (!same(value.minimum, ticks[0]!) || !same(value.maximum, ticks[ticks.length - 1]!) || ticks[value.zeroIndex]!.numerator !== 0) return false;
    const step = value.step;
    return ticks.slice(1).every((tick, index) => {
        const previous = ticks[index]!;
        return (BigInt(tick.numerator) * BigInt(previous.denominator) - BigInt(previous.numerator) * BigInt(tick.denominator)) * BigInt(step.denominator)
            === BigInt(step.numerator) * BigInt(tick.denominator) * BigInt(previous.denominator);
    });
}

/** A bounded readable lattice constructor; generic validation accepts wider complete scales. */
export function makeSignedRationalAxis(step: SignedRational, firstTick: number, lastTick: number): SignedRationalAxis {
    if (!isCanonicalSignedRational(step) || step.numerator <= 0 || !integer(firstTick) || !integer(lastTick)
        || firstTick > 0 || lastTick < 0 || lastTick <= firstTick || lastTick - firstTick > 10
        || !Number.isSafeInteger(step.numerator * Math.max(Math.abs(firstTick), lastTick))) {
        throw new GeneratorValidationError(helperId, 'A positive step and safe 2..11-tick lattice containing zero are required.');
    }
    const ticks = Array.from({length: lastTick - firstTick + 1}, (_, index) =>
        makeSignedRational((firstTick + index) * step.numerator, step.denominator));
    return {minimum: ticks[0]!, maximum: ticks[ticks.length - 1]!, step: {...step}, ticks, zeroIndex: -firstTick || 0};
}

export function isSignedRationalLocation(value: unknown, axis: SignedRationalAxis): value is SignedRationalLocation {
    return isSignedRationalAxis(axis) && record(value) && isCanonicalSignedRational(value.value) && isCanonicalSignedRational(value.magnitude)
        && integer(value.tickIndex) && value.tickIndex >= 0 && value.tickIndex < axis.ticks.length
        && same(value.value, axis.ticks[value.tickIndex]!) && !Object.is(value.sign, -0) && value.sign === Math.sign(value.value.numerator)
        && value.magnitude.numerator === Math.abs(value.value.numerator) && value.magnitude.denominator === value.value.denominator;
}

export function makeSignedRationalLocation(axis: SignedRationalAxis, tickIndex: number): SignedRationalLocation {
    if (!isSignedRationalAxis(axis) || !integer(tickIndex) || tickIndex < 0 || tickIndex >= axis.ticks.length) {
        throw new GeneratorValidationError(helperId, 'A coherent exact scale and valid tick index are required.');
    }
    const value = axis.ticks[tickIndex]!;
    return {value: {...value}, tickIndex, sign: Math.sign(value.numerator) as -1 | 0 | 1, magnitude: absoluteSignedRational(value)};
}
