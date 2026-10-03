import type {FractionQuotientProblem, FractionQuotientValue} from '../../../types/problems.ts';

const validValue = (value: FractionQuotientValue | undefined): value is FractionQuotientValue =>
    !!value && Number.isSafeInteger(value.numerator) && value.numerator >= 0
    && Number.isSafeInteger(value.denominator) && value.denominator > 0;

const equal = (left: FractionQuotientValue, right: FractionQuotientValue): boolean =>
    BigInt(left.numerator) * BigInt(right.denominator)
    === BigInt(right.numerator) * BigInt(left.denominator);

const productEquals = (left: FractionQuotientValue, right: FractionQuotientValue,
    result: FractionQuotientValue): boolean =>
    BigInt(left.numerator) * BigInt(right.numerator) * BigInt(result.denominator)
    === BigInt(result.numerator) * BigInt(left.denominator) * BigInt(right.denominator);

const smallCount = (value: number, minimum: number, maximum: number): boolean =>
    Number.isSafeInteger(value) && value >= minimum && value <= maximum;

const validStory = (data: FractionQuotientProblem): boolean =>
    !!data.story && (data.story.material === 'ribbon' || data.story.material === 'rope')
    && data.story.measureUnit === 'meter'
    && (data.orientation === 'whole-by-unit-fraction'
        ? data.story.groupUnit === 'piece'
        : data.story.recipientUnit === 'person');

/** Checks exact quotient, inverse, story, and partition/count witnesses for all union arms. */
export function isValidFractionQuotient(data: FractionQuotientProblem): boolean {
    if (!data || data.kind !== 'fraction-quotient'
        || !validValue(data.dividend) || !validValue(data.divisor) || data.divisor.numerator === 0
        || !validValue(data.quotient) || !productEquals(data.quotient, data.divisor, data.dividend)
        || !data.inverse || !validValue(data.inverse.quotientFactor)
        || !validValue(data.inverse.divisorFactor) || !validValue(data.inverse.reconstructedDividend)
        || !equal(data.inverse.quotientFactor, data.quotient)
        || !equal(data.inverse.divisorFactor, data.divisor)
        || !equal(data.inverse.reconstructedDividend, data.dividend)
        || !validStory(data)) return false;

    if (data.orientation === 'whole-by-whole') {
        const {model} = data;
        if (!model || model.kind !== 'equal-sharing'
            || data.dividend.denominator !== 1 || data.divisor.denominator !== 1
            || !smallCount(data.dividend.numerator, 0, 6)
            || !smallCount(data.divisor.numerator, 1, 6)
            || model.wholeUnitCount !== data.dividend.numerator
            || model.recipientCount !== data.divisor.numerator
            || model.partsPerWhole !== data.divisor.numerator
            || model.totalParts !== model.wholeUnitCount * model.partsPerWhole
            || model.partsPerRecipient !== model.wholeUnitCount
            || data.quotient.numerator !== data.dividend.numerator
            || data.quotient.denominator !== data.divisor.numerator) return false;
    } else if (data.orientation === 'unit-fraction-by-whole') {
        const {model} = data;
        if (!model || model.kind !== 'unit-part-sharing'
            || data.dividend.numerator !== 1 || !smallCount(data.dividend.denominator, 2, 6)
            || data.divisor.denominator !== 1 || !smallCount(data.divisor.numerator, 1, 6)
            || model.wholePartitionCount !== data.dividend.denominator
            || model.recipientCount !== data.divisor.numerator
            || model.refinedPartitionCount !== model.wholePartitionCount * model.recipientCount
            || model.sharedFineParts !== model.recipientCount
            || data.quotient.numerator !== 1
            || data.quotient.denominator !== model.refinedPartitionCount) return false;
    } else if (data.orientation === 'whole-by-unit-fraction') {
        const {model} = data;
        if (!model || model.kind !== 'unit-part-group-count'
            || data.dividend.denominator !== 1 || !smallCount(data.dividend.numerator, 0, 6)
            || data.divisor.numerator !== 1 || !smallCount(data.divisor.denominator, 2, 6)
            || model.wholeUnitCount !== data.dividend.numerator
            || model.partsPerWhole !== data.divisor.denominator
            || model.groupCount !== model.wholeUnitCount * model.partsPerWhole
            || data.quotient.numerator !== model.groupCount
            || data.quotient.denominator !== 1) return false;
    } else return false;

    if (data.equationWitness) {
        const witness = data.equationWitness;
        if (!validValue(witness.totalMeasure) || !validValue(witness.groupCount)
            || !validValue(witness.measurePerGroup) || !equal(witness.totalMeasure, data.dividend)
            || !productEquals(witness.groupCount, witness.measurePerGroup, witness.totalMeasure)) return false;
        if (data.orientation === 'whole-by-unit-fraction') {
            if (!equal(witness.groupCount, data.quotient)
                || !equal(witness.measurePerGroup, data.divisor)) return false;
        } else if (!equal(witness.groupCount, data.divisor)
            || !equal(witness.measurePerGroup, data.quotient)) return false;
    }
    if (data.multiplicationWitness) {
        const witness = data.multiplicationWitness;
        if (!validValue(witness.unreducedProduct) || !validValue(witness.reconstructedDividend)
            || !Number.isSafeInteger(data.quotient.numerator * data.divisor.numerator)
            || !Number.isSafeInteger(data.quotient.denominator * data.divisor.denominator)
            || witness.unreducedProduct.numerator !== data.quotient.numerator * data.divisor.numerator
            || witness.unreducedProduct.denominator !== data.quotient.denominator * data.divisor.denominator
            || !equal(witness.reconstructedDividend, data.dividend)
            || !equal(witness.unreducedProduct, data.dividend)) return false;
    }
    return true;
}

export const formatQuotientValue = (value: FractionQuotientValue): string =>
    value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`;

export const formatOriginalFraction = (value: FractionQuotientValue): string =>
    `${value.numerator}/${value.denominator}`;

export const measure = (value: FractionQuotientValue): string =>
    `${formatQuotientValue(value)} ${value.numerator > 0 && value.numerator <= value.denominator ? 'meter' : 'meters'}`;
