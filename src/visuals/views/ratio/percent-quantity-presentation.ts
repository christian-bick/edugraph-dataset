import type {PercentQuantityProblem, RatioRational} from '../../../types/problems.ts';
import {isRatioRational} from './ratio-language-presentation.ts';

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** Exact cross products validate supplied witnesses without rounding or deriving task answers. */
export const isPercentQuantity = (value: unknown): value is PercentQuantityProblem => {
    if (!isRecord(value) || value.kind !== 'percent-quantity'
        || typeof value.percent !== 'number' || !Number.isSafeInteger(value.percent) || value.percent <= 0
        || !isRecord(value.perHundred) || value.perHundred.numerator !== value.percent
        || value.perHundred.denominator !== 100
        || !isRatioRational(value.scaleFactor) || value.scaleFactor.numerator <= 0
        || !isRatioRational(value.whole) || value.whole.numerator <= 0
        || !isRatioRational(value.part) || value.part.numerator <= 0) return false;
    const p = BigInt(value.percent);
    const factor = value.scaleFactor;
    const whole = value.whole;
    const part = value.part;
    return p * BigInt(factor.denominator) === 100n * BigInt(factor.numerator)
        && p * BigInt(whole.numerator) * BigInt(part.denominator)
        === 100n * BigInt(part.numerator) * BigInt(whole.denominator);
};

export const percentRationalText = ({numerator, denominator}: RatioRational): string =>
    denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;

export const percentFactorText = (value: RatioRational): string =>
    value.denominator === 1 ? percentRationalText(value) : `(${percentRationalText(value)})`;
