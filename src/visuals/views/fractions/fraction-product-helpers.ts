import type {
    FractionProductFractionOperand,
    FractionProductMixedOperand,
    FractionProductProblem,
    FractionProductValue
} from '../../../types/problems.ts';

const validValue = (value: FractionProductValue | undefined): value is FractionProductValue =>
    !!value && Number.isSafeInteger(value.numerator) && value.numerator > 0
    && Number.isSafeInteger(value.denominator) && value.denominator > 0;

const equal = (first: FractionProductValue, second: FractionProductValue): boolean =>
    BigInt(first.numerator) * BigInt(second.denominator)
    === BigInt(second.numerator) * BigInt(first.denominator);

const productEquals = (first: FractionProductValue, second: FractionProductValue,
    result: FractionProductValue): boolean =>
    BigInt(first.numerator) * BigInt(second.numerator) * BigInt(result.denominator)
    === BigInt(result.numerator) * BigInt(first.denominator) * BigInt(second.denominator);

const withinSix = (value: FractionProductValue): boolean =>
    BigInt(value.numerator) <= 6n * BigInt(value.denominator);

const validFractionOperand = (value: FractionProductFractionOperand | undefined): boolean =>
    !!value && value.form === 'fraction' && validValue(value);

const validMixedOperand = (value: FractionProductMixedOperand | undefined): boolean =>
    !!value && value.form === 'mixed'
    && Number.isSafeInteger(value.whole) && value.whole >= 1
    && Number.isSafeInteger(value.fractionNumerator) && value.fractionNumerator > 0
    && Number.isSafeInteger(value.denominator) && value.denominator > value.fractionNumerator
    && Number.isSafeInteger(value.improperNumerator)
    && value.improperNumerator === value.whole * value.denominator + value.fractionNumerator;

/** Validates both original notations and each exact q/b partition/product witness. */
export function isValidFractionProduct(data: FractionProductProblem): boolean {
    if (!data || data.kind !== 'fraction-product' || data.sharedWhole !== 1
        || !validValue(data.multiplierValue) || !validValue(data.quantityValue)
        || !validValue(data.product) || !data.context
        || (data.context.material !== 'ribbon' && data.context.material !== 'rope')
        || data.context.measureUnit !== 'meter' || !data.partition
        || !Number.isSafeInteger(data.partition.equalPartsPerCopy)
        || data.partition.equalPartsPerCopy < 2 || data.partition.equalPartsPerCopy > 6
        || !Number.isSafeInteger(data.partition.selectedPartCount)
        || data.partition.selectedPartCount < 1
        || data.partition.selectedPartCount >= 3 * data.partition.equalPartsPerCopy
        || !withinSix(data.quantityValue)
        || data.quantityValue.denominator > 6) return false;

    const {equalPartsPerCopy: b, selectedPartCount: a} = data.partition;
    if (data.multiplierValue.numerator !== a || data.multiplierValue.denominator !== b
        || data.partition.copyCount !== Math.ceil(a / b)
        || data.partition.availablePartCount !== data.partition.copyCount * b
        || !validValue(data.partition.onePartValue)
        || !validValue(data.partition.scaledQuantity)
        || !productEquals(data.quantityValue, {numerator: 1, denominator: b}, data.partition.onePartValue)
        || !productEquals(data.quantityValue, {numerator: a, denominator: 1}, data.partition.scaledQuantity)
        || !productEquals(data.multiplierValue, data.quantityValue, data.product)
        || !productEquals({numerator: a, denominator: 1}, data.partition.onePartValue, data.product)) return false;

    if (data.operandForm === 'fractions') {
        if (!validFractionOperand(data.multiplier) || !validFractionOperand(data.quantity)
            || data.multiplier.numerator !== a || data.multiplier.denominator !== b
            || data.quantity.numerator !== data.quantityValue.numerator
            || data.quantity.denominator !== data.quantityValue.denominator) return false;
    } else if (data.operandForm === 'mixed-numbers') {
        if (!validMixedOperand(data.multiplier) || !validMixedOperand(data.quantity)
            || data.multiplier.improperNumerator !== a || data.multiplier.denominator !== b
            || data.quantity.improperNumerator !== data.quantityValue.numerator
            || data.quantity.denominator !== data.quantityValue.denominator) return false;
    } else return false;

    if (data.equationWitness) {
        const witness = data.equationWitness;
        if (!validValue(witness.factor) || !validValue(witness.referenceMeasure)
            || !validValue(witness.productMeasure) || witness.measureUnit !== 'meter'
            || !equal(witness.factor, data.multiplierValue)
            || !equal(witness.referenceMeasure, data.quantityValue)
            || !equal(witness.productMeasure, data.product)) return false;
    }
    return true;
}

export const formatProductValue = (value: FractionProductValue): string =>
    value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`;

export const formatProductOperand = (value: FractionProductFractionOperand | FractionProductMixedOperand): string =>
    value.form === 'mixed'
        ? `${value.whole} ${value.fractionNumerator}/${value.denominator}`
        : formatProductValue(value);

export const measureProductValue = (value: FractionProductValue): string =>
    `${formatProductValue(value)} ${value.numerator <= value.denominator ? 'meter' : 'meters'}`;
