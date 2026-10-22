import type {OrderedSignedContextMetadata, RationalMagnitudeContextProblem, RationalMagnitudeRelationProblem, RationalOrderContextProblem, RationalOrderRelationProblem, SignedContextObservation, SignedRational, SignedRationalAxis, SignedRationalLocation} from '../../../types/problems.ts';
import {isSignedRational} from './signed-meaning-helpers.ts';

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && !Object.is(value, -0);
const same = (a: SignedRational, b: SignedRational) => a.numerator === b.numerator && a.denominator === b.denominator;
const compare = (a: SignedRational, b: SignedRational) => {
    const difference = BigInt(a.numerator) * BigInt(b.denominator) - BigInt(b.numerator) * BigInt(a.denominator);
    return difference < 0n ? 'less' : difference > 0n ? 'greater' : 'equal';
};
function isMagnitude(value: SignedRational, magnitude: SignedRational): boolean {
    return magnitude.numerator === Math.abs(value.numerator) && magnitude.denominator === value.denominator;
}
export function isOrderMagnitudeAxis(value: unknown): value is SignedRationalAxis {
    if (!record(value) || !isSignedRational(value.minimum) || !isSignedRational(value.maximum) || !isSignedRational(value.step) || value.step.numerator <= 0 ||
        !Array.isArray(value.ticks) || value.ticks.length < 2 || !Array.from(value.ticks).every(isSignedRational) || !integer(value.zeroIndex) || value.zeroIndex < 0 || value.zeroIndex >= value.ticks.length) return false;
    const ticks: SignedRational[] = value.ticks, step = value.step;
    if (!same(ticks[0]!, value.minimum) || !same(ticks.at(-1)!, value.maximum) || ticks[value.zeroIndex]!.numerator !== 0) return false;
    return ticks.slice(1).every((tick, index) => {
        const previous = ticks[index]!;
        return (BigInt(tick.numerator) * BigInt(previous.denominator) - BigInt(previous.numerator) * BigInt(tick.denominator)) * BigInt(step.denominator) ===
            BigInt(step.numerator) * BigInt(tick.denominator) * BigInt(previous.denominator);
    });
}
function isLocation(value: unknown, axis: SignedRationalAxis): value is SignedRationalLocation {
    return record(value) && isSignedRational(value.value) && isSignedRational(value.magnitude) && integer(value.tickIndex) && value.tickIndex >= 0 && value.tickIndex < axis.ticks.length &&
        same(value.value, axis.ticks[value.tickIndex]!) && integer(value.sign) && value.sign === Math.sign(value.value.numerator) && isMagnitude(value.value, value.magnitude);
}
function isContext(value: unknown): value is OrderedSignedContextMetadata {
    if (!record(value) || typeof value.kind !== 'string') return false;
    const metadata: Record<string, readonly [string, string]> = {temperature: ['celsius-zero', 'degrees-celsius'], elevation: ['sea-level', 'meters'], balance: ['settled-balance', 'dollars']};
    if (!Object.hasOwn(metadata, value.kind)) return false;
    const expected = metadata[value.kind]!;
    return value.reference === expected[0] && value.unit === expected[1];
}
function isObservation(value: unknown): value is SignedContextObservation {
    return record(value) && typeof value.id === 'string' && value.id.length > 0 && value.id.trim() === value.id && isSignedRational(value.value) && isSignedRational(value.magnitude) &&
        integer(value.sign) && value.sign === Math.sign(value.value.numerator) && isMagnitude(value.value, value.magnitude);
}
function isContextPair(value: Record<string, unknown>): value is Record<string, unknown> & {context: OrderedSignedContextMetadata; first: SignedContextObservation; second: SignedContextObservation} {
    return isContext(value.context) && isObservation(value.first) && isObservation(value.second) && value.first.id !== value.second.id && compare(value.first.value, value.second.value) !== 'equal';
}
export function isRationalOrderRelation(value: unknown): value is RationalOrderRelationProblem {
    return record(value) && value.kind === 'rational-order-relations' && isOrderMagnitudeAxis(value.axis) && isLocation(value.first, value.axis) && isLocation(value.second, value.axis) &&
        (value.relation === 'less' || value.relation === 'greater') && value.relation === compare(value.first.value, value.second.value);
}
export function isRationalOrderContext(value: unknown): value is RationalOrderContextProblem {
    return record(value) && value.kind === 'rational-order-contexts' && isContextPair(value) && (value.relation === 'less' || value.relation === 'greater') && value.relation === compare(value.first.value, value.second.value);
}
export function isRationalMagnitudeRelation(value: unknown): value is RationalMagnitudeRelationProblem {
    if (!record(value) || value.kind !== 'rational-magnitude-relations' || !isOrderMagnitudeAxis(value.axis) || !isLocation(value.point, value.axis) || !record(value.distance)) return false;
    return integer(value.distance.fromTickIndex) && integer(value.distance.toTickIndex) && value.distance.fromTickIndex === value.axis.zeroIndex && value.distance.toTickIndex === value.point.tickIndex &&
        isSignedRational(value.distance.length) && same(value.distance.length, value.point.magnitude);
}
export function isRationalMagnitudeContext(value: unknown): value is RationalMagnitudeContextProblem {
    return record(value) && value.kind === 'rational-magnitude-contexts' && isContextPair(value) && (value.signedRelation === 'less' || value.signedRelation === 'greater') &&
        value.signedRelation === compare(value.first.value, value.second.value) && value.magnitudeRelation === compare(value.first.magnitude, value.second.magnitude);
}
