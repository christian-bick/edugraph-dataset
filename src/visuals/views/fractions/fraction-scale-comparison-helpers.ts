import type {FractionScaleComparisonProblem, FractionScaleRational, FractionScaleRelationProblem} from '../../../types/problems.ts';

const record = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const positiveInteger = (value: unknown): value is number =>
    typeof value === 'number' && Number.isSafeInteger(value) && value > 0;

const rational = (value: unknown): value is FractionScaleRational =>
    record(value) && positiveInteger(value.numerator) && positiveInteger(value.denominator);

const equal = (left: FractionScaleRational, right: FractionScaleRational): boolean =>
    BigInt(left.numerator) * BigInt(right.denominator)
    === BigInt(right.numerator) * BigInt(left.denominator);

/** Shared exact mathematics; an unused product/difference does not enlarge the task's quantities. */
function hasValidScalingMathematics(value: Record<string, unknown>): boolean {
    if (!rational(value.reference) || !rational(value.scaleFactor)
        || !rational(value.product) || !rational(value.onePart)
        || value.scaleFactor.denominator <= 1
        || value.scaleFactor.denominator > 6
        || value.scaleFactor.numerator >= 2 * value.scaleFactor.denominator
        || value.reference.denominator !== 1
        || value.reference.numerator < 2 || value.reference.numerator > 5
        || !Number.isSafeInteger(value.partDifferenceCount)) return false;

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
    const relation = a > b ? 'greater' : a < b ? 'less' : 'equal';
    return productIsExact && partIsExact
        && value.partDifferenceCount === factor.numerator - factor.denominator
        && value.relation === relation
        && (relation === 'greater' ? productNum * qDen > qNum * productDen
            : relation === 'less' ? productNum * qDen < qNum * productDen
                : equal(product, q));
}

/** Analogy-bearing family validates every equal-part and whole-number witness. */
export function isValidFractionScaleComparison(value: unknown): value is FractionScaleComparisonProblem {
    return record(value) && value.kind === 'fraction-scale-comparison' && hasValidScalingMathematics(value)
        && rational(value.reference) && record(value.wholeNumberAnalogy)
        && value.wholeNumberAnalogy.factor === 2 && rational(value.wholeNumberAnalogy.product)
        && BigInt(value.wholeNumberAnalogy.product.numerator) * BigInt(value.reference.denominator)
            === 2n * BigInt(value.reference.numerator) * BigInt(value.wholeNumberAnalogy.product.denominator);
}

/** The comparison contract rejects an analogy even if it was attached to the other discriminant. */
export function isValidFractionScaleRelation(value: unknown): value is FractionScaleRelationProblem {
    return record(value) && value.kind === 'fraction-scale-relation'
        && !('wholeNumberAnalogy' in value) && hasValidScalingMathematics(value);
}

export const formatScaleRational = ({numerator, denominator}: FractionScaleRational): string =>
    denominator === 1 ? String(numerator) : `${numerator}/${denominator}`;

export const formatOriginalScaleFraction = ({numerator, denominator}: FractionScaleRational): string =>
    `${numerator}/${denominator}`;
