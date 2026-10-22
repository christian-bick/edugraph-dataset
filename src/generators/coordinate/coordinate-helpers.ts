import {GeneratorValidationError} from '../../lib/errors.ts';
import type {CoordinateLocationTag, FormattedSignedRationalLocation, RationalCoordinateAxes, RationalCoordinateAxis,
    RationalCoordinatePoint, SignedRational, SignedRationalNotation} from '../../types/problems.ts';
import {absoluteSignedRational, isCanonicalSignedRational, makeSignedRational} from '../number/signed-rational-helpers.ts';

const helperId = 'rational-coordinates';
const record = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
const same = (first: SignedRational, second: SignedRational): boolean => first.numerator === second.numerator && first.denominator === second.denominator;
const validScale = (scale: unknown): scale is number => integer(scale) && scale >= 0 && scale <= 15;

function decimalNumeral(coefficient: number, scale: number): string {
    if (scale === 0) return String(coefficient);
    const digits = String(Math.abs(coefficient)).padStart(scale + 1, '0');
    return `${coefficient < 0 ? '-' : ''}${digits.slice(0, -scale)}.${digits.slice(-scale)}`;
}

/** A supplied form is checked for exact equivalence without reducing away its original notation. */
export function isCoordinateNotation(value: SignedRational, notation: unknown): notation is SignedRationalNotation {
    if (!isCanonicalSignedRational(value) || !record(notation)) return false;
    if (notation.kind === 'integer') return value.denominator === 1 && notation.numeral === String(value.numerator);
    if (notation.kind === 'fraction') return integer(notation.numerator) && integer(notation.denominator) && notation.denominator > 0
        && BigInt(notation.numerator) * BigInt(value.denominator) === BigInt(value.numerator) * BigInt(notation.denominator);
    return notation.kind === 'decimal' && integer(notation.coefficient) && validScale(notation.scale)
        && notation.numeral === decimalNumeral(notation.coefficient, notation.scale)
        && BigInt(notation.coefficient) * BigInt(value.denominator) === BigInt(value.numerator) * 10n ** BigInt(notation.scale);
}

export function makeCoordinateNotation(value: SignedRational, kind: SignedRationalNotation['kind'], decimalScale = 2): SignedRationalNotation {
    if (!isCanonicalSignedRational(value)) throw new GeneratorValidationError(helperId, 'A canonical signed rational is required.');
    if (kind === 'fraction') return {kind, numerator: value.numerator, denominator: value.denominator};
    if (kind === 'integer' && value.denominator === 1) return {kind, numeral: String(value.numerator)};
    if (kind !== 'decimal' || !validScale(decimalScale)) throw new GeneratorValidationError(helperId, 'The selected exact numeric form is not representable.');
    const scaled = BigInt(value.numerator) * 10n ** BigInt(decimalScale);
    const denominator = BigInt(value.denominator);
    if (scaled % denominator !== 0n) throw new GeneratorValidationError(helperId, 'The selected decimal precision cannot represent this rational exactly.');
    const coefficient = Number(scaled / denominator);
    if (!Number.isSafeInteger(coefficient)) throw new GeneratorValidationError(helperId, 'The exact decimal coefficient exceeds safe integer precision.');
    return {kind, coefficient, scale: decimalScale, numeral: decimalNumeral(coefficient, decimalScale)};
}

/** Validate the generic axis, including unequal or nonsymmetric frames and endpoint zero. */
export function isRationalCoordinateAxis(value: unknown): value is RationalCoordinateAxis {
    if (!record(value) || !isCanonicalSignedRational(value.minimum) || !isCanonicalSignedRational(value.maximum)
        || !isCanonicalSignedRational(value.step) || value.step.numerator <= 0
        || !Array.isArray(value.ticks) || value.ticks.length < 2 || !Array.from(value.ticks).every(isCanonicalSignedRational)
        || !integer(value.zeroIndex) || value.zeroIndex < 0 || value.zeroIndex >= value.ticks.length
        || !Array.isArray(value.tickNotations) || value.tickNotations.length !== value.ticks.length) return false;
    const ticks: SignedRational[] = value.ticks;
    const notations: unknown[] = value.tickNotations;
    const step = value.step;
    if (!same(value.minimum, ticks[0]!) || !same(value.maximum, ticks[ticks.length - 1]!)
        || ticks[value.zeroIndex]!.numerator !== 0 || !isCoordinateNotation(step, value.stepNotation)
        || !Array.from(notations).every((notation, index) => isCoordinateNotation(ticks[index]!, notation))) return false;
    return ticks.slice(1).every((tick, index) => {
        const previous = ticks[index]!;
        return (BigInt(tick.numerator) * BigInt(previous.denominator) - BigInt(previous.numerator) * BigInt(tick.denominator)) * BigInt(step.denominator)
            === BigInt(step.numerator) * BigInt(tick.denominator) * BigInt(previous.denominator);
    });
}

export const isRationalCoordinateAxes = (value: unknown): value is RationalCoordinateAxes => record(value)
    && isRationalCoordinateAxis(value.x) && isRationalCoordinateAxis(value.y);

/** A small lattice constructor; the generic validator does not impose this sampling tick budget. */
export function makeCoordinateAxis(step: SignedRational, firstTick: number, lastTick: number,
    notationKind: SignedRationalNotation['kind'], decimalScale = 2): RationalCoordinateAxis {
    if (!isCanonicalSignedRational(step) || step.numerator <= 0 || !integer(firstTick) || !integer(lastTick)
        || firstTick > 0 || lastTick < 0 || lastTick <= firstTick || lastTick - firstTick > 10
        || !Number.isSafeInteger(step.numerator * Math.max(Math.abs(firstTick), lastTick))) {
        throw new GeneratorValidationError(helperId, 'A positive step and safe 2..11-tick lattice containing zero are required.');
    }
    const ticks = Array.from({length: lastTick - firstTick + 1}, (_, index) =>
        makeSignedRational((firstTick + index) * step.numerator, step.denominator));
    return {minimum: ticks[0]!, maximum: ticks[ticks.length - 1]!, step: {...step}, ticks, zeroIndex: -firstTick || 0,
        tickNotations: ticks.map(value => makeCoordinateNotation(value, notationKind, decimalScale)),
        stepNotation: makeCoordinateNotation(step, notationKind, decimalScale)};
}

function locationTag(x: number, y: number): CoordinateLocationTag {
    if (x === 0) return y === 0 ? 'origin' : 'y-axis';
    if (y === 0) return 'x-axis';
    return x > 0 ? y > 0 ? 'quadrant-I' : 'quadrant-IV' : y > 0 ? 'quadrant-II' : 'quadrant-III';
}

function isLocation(value: unknown, axis: RationalCoordinateAxis): value is FormattedSignedRationalLocation {
    return record(value) && isCanonicalSignedRational(value.value) && isCanonicalSignedRational(value.magnitude)
        && integer(value.tickIndex) && value.tickIndex >= 0 && value.tickIndex < axis.ticks.length
        && same(value.value, axis.ticks[value.tickIndex]!) && !Object.is(value.sign, -0) && value.sign === Math.sign(value.value.numerator)
        && value.magnitude.numerator === Math.abs(value.value.numerator) && value.magnitude.denominator === value.value.denominator
        && isCoordinateNotation(value.value, value.notation);
}

export function isRationalCoordinatePoint(value: unknown, axes: RationalCoordinateAxes): value is RationalCoordinatePoint {
    return isRationalCoordinateAxes(axes) && record(value) && typeof value.id === 'string' && value.id.length > 0 && value.id.trim() === value.id
        && isLocation(value.x, axes.x) && isLocation(value.y, axes.y) && value.locationTag === locationTag(value.x.sign, value.y.sign);
}

export function makeCoordinatePoint(id: string, axes: RationalCoordinateAxes, xTickIndex: number, yTickIndex: number,
    notations?: {x: SignedRationalNotation; y: SignedRationalNotation}): RationalCoordinatePoint {
    if (!isRationalCoordinateAxes(axes) || typeof id !== 'string' || !id || id.trim() !== id
        || !integer(xTickIndex) || xTickIndex < 0 || xTickIndex >= axes.x.ticks.length
        || !integer(yTickIndex) || yTickIndex < 0 || yTickIndex >= axes.y.ticks.length) {
        throw new GeneratorValidationError(helperId, 'A coherent exact frame, identifier and valid coordinate tick indices are required.');
    }
    const xValue = axes.x.ticks[xTickIndex]!;
    const yValue = axes.y.ticks[yTickIndex]!;
    const selected = notations === undefined ? {x: axes.x.tickNotations[xTickIndex]!, y: axes.y.tickNotations[yTickIndex]!} : notations;
    if (!record(selected) || !isCoordinateNotation(xValue, selected.x) || !isCoordinateNotation(yValue, selected.y)) {
        throw new GeneratorValidationError(helperId, 'Point notation must equal its exact coordinate value.');
    }
    const location = (value: SignedRational, tickIndex: number, notation: SignedRationalNotation): FormattedSignedRationalLocation =>
        ({value: {...value}, tickIndex, notation: {...notation}, sign: Math.sign(value.numerator) as -1 | 0 | 1, magnitude: absoluteSignedRational(value)});
    const x = location(xValue, xTickIndex, selected.x);
    const y = location(yValue, yTickIndex, selected.y);
    return {id, x, y, locationTag: locationTag(x.sign, y.sign)};
}
