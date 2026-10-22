import {GeneratorValidationError} from '../../lib/errors.ts';
import type {RationalSign, SignedRational} from '../../types/problems.ts';

const helperId = 'signed-rational-relations';
const absoluteInteger = (value: bigint): bigint => value < 0n ? -value : value;
const greatestCommonDivisor = (first: bigint, second: bigint): bigint => {
    while (second !== 0n) [first, second] = [second, first % second];
    return first;
};

/** Construct an exact reduced rational; zero has a single canonical representation. */
export function makeSignedRational(numerator: number, denominator: number): SignedRational {
    if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator <= 0) {
        throw new GeneratorValidationError(helperId, 'Rational components must be safe integers with a positive denominator.');
    }
    if (numerator === 0) return {numerator: 0, denominator: 1};
    const divisor = greatestCommonDivisor(absoluteInteger(BigInt(numerator)), BigInt(denominator));
    return {numerator: Number(BigInt(numerator) / divisor), denominator: Number(BigInt(denominator) / divisor)};
}

/** Supplied data must already be reduced, with positive denominator and no negative zero. */
export function isCanonicalSignedRational(value: unknown): value is SignedRational {
    if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
    const {numerator, denominator} = value as Record<string, unknown>;
    return typeof numerator === 'number' && typeof denominator === 'number'
        && Number.isSafeInteger(numerator) && Number.isSafeInteger(denominator)
        && !Object.is(numerator, -0) && denominator > 0
        && greatestCommonDivisor(absoluteInteger(BigInt(numerator)), BigInt(denominator)) === 1n;
}

function assertCanonical(value: SignedRational): void {
    if (!isCanonicalSignedRational(value)) {
        throw new GeneratorValidationError(helperId, 'Expected a canonical signed rational.');
    }
}

export function negateSignedRational(value: SignedRational): SignedRational {
    assertCanonical(value);
    return makeSignedRational(-value.numerator, value.denominator);
}

export function absoluteSignedRational(value: SignedRational): SignedRational {
    assertCanonical(value);
    return makeSignedRational(Math.abs(value.numerator), value.denominator);
}

/** BigInt cross-products remain exact even when safe input components have unsafe products. */
export function compareSignedRationals(first: SignedRational, second: SignedRational): RationalSign {
    assertCanonical(first);
    assertCanonical(second);
    const left = BigInt(first.numerator) * BigInt(second.denominator);
    const right = BigInt(second.numerator) * BigInt(first.denominator);
    return left < right ? -1 : left > right ? 1 : 0;
}
