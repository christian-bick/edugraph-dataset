import type {FractionScaleComparisonProblem, FractionScaleRational} from '../../../types/problems.ts';

const record = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const positiveInteger = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const rational = (value: unknown): value is FractionScaleRational =>
    record(value) && positiveInteger(value.numerator) && positiveInteger(value.denominator);

const equal = (left: FractionScaleRational, right: FractionScaleRational): boolean =>
    BigInt(left.numerator) * BigInt(right.denominator)
    === BigInt(right.numerator) * BigInt(left.denominator);

/** Verify every exact scaling, comparison, and equal-part witness before rendering. */
export function isValidFractionScaleComparison(value: unknown): value is FractionScaleComparisonProblem {
    if (!record(value) || value.kind !== 'fraction-scale-comparison'
        || !rational(value.reference) || !rational(value.scaleFactor)
        || !rational(value.product) || !rational(value.onePart)
        || value.scaleFactor.denominator <= 1
        || value.scaleFactor.denominator > 6
        || value.scaleFactor.numerator >= 2 * value.scaleFactor.denominator
        || value.reference.denominator !== 1
        || value.reference.numerator < 2 || value.reference.numerator > 5
        || !Number.isSafeInteger(value.partDifferenceCount)
        || !record(value.wholeNumberAnalogy)
        || value.wholeNumberAnalogy.factor !== 2
        || !rational(value.wholeNumberAnalogy.product)) return false;

    const {reference: q, scaleFactor: factor, product, onePart: part} = value;
    const a = BigInt(factor.numerator);
    const b = BigInt(factor.denominator);
    const qNum = BigInt(q.numerator);
    const qDen = BigInt(q.denominator);
    const productNum = BigInt(product.numerator);
    const productDen = BigInt(product.denominator);
    const partNum = BigInt(part.numerator);
    const partDen = BigInt(part.denominator);
    const productIsExact = productNum * qDen * b === qNum * a * productDen;
    const partIsExact = partNum * qDen * b === qNum * partDen;
    const analogyIsExact = BigInt(value.wholeNumberAnalogy.product.numerator) * qDen
        === 2n * qNum * BigInt(value.wholeNumberAnalogy.product.denominator);
    const relation = a > b ? 'greater' : a < b ? 'less' : 'equal';
    return productIsExact && partIsExact && analogyIsExact
        && value.partDifferenceCount === factor.numerator - factor.denominator
        && value.relation === relation
        && (relation === 'greater' ? productNum * qDen > qNum * productDen
            : relation === 'less' ? productNum * qDen < qNum * productDen
                : equal(product, q));
}

export const formatScaleRational = ({numerator, denominator}: FractionScaleRational): string =>
    denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;

export const formatOriginalScaleFraction = ({numerator, denominator}: FractionScaleRational): string =>
    `${numerator}/${denominator}`;
