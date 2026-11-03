import type {FractionPartitionQuotientProblem, FractionQuotientContent, FractionQuotientProblem, FractionQuotientValue,
    FractionSharingQuotientProblem, FractionUnitPartitionProblem, FractionUnitSharingProblem} from '../../../types/problems.ts';

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

const validStory = (data: FractionQuotientContent): boolean =>
    !!data.story && (data.story.material === 'ribbon' || data.story.material === 'rope')
    && data.story.measureUnit === 'meter'
    && (data.orientation === 'whole-by-unit-fraction'
        ? data.story.groupUnit === 'piece'
        : data.story.recipientUnit === 'person');

function validCommon(data: FractionQuotientContent): boolean {
    if (!data
        || !validValue(data.dividend) || !validValue(data.divisor) || data.divisor.numerator === 0
        || !validValue(data.quotient) || !productEquals(data.quotient, data.divisor, data.dividend)
        || !data.inverse || !validValue(data.inverse.quotientFactor)
        || !validValue(data.inverse.divisorFactor) || !validValue(data.inverse.reconstructedDividend)
        || !equal(data.inverse.quotientFactor, data.quotient)
        || !equal(data.inverse.divisorFactor, data.divisor)
        || !equal(data.inverse.reconstructedDividend, data.dividend)
        || !validStory(data)) return false;
    if (data.equationWitness) {
        const witness = data.equationWitness;
        if (!validValue(witness.totalMeasure) || !validValue(witness.groupCount)
            || !validValue(witness.measurePerGroup) || !equal(witness.totalMeasure, data.dividend)
            || !productEquals(witness.groupCount, witness.measurePerGroup, witness.totalMeasure)) return false;
        if (data.orientation === 'whole-by-unit-fraction') {
            if (!equal(witness.groupCount, data.quotient) || !equal(witness.measurePerGroup, data.divisor)) return false;
        } else if (!equal(witness.groupCount, data.divisor) || !equal(witness.measurePerGroup, data.quotient)) return false;
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

/** Legacy whole-sharing/group-count payloads reject either new unit family. */
export function isValidFractionQuotient(data: unknown): data is FractionQuotientProblem {
    try { return !!data && typeof data === 'object' && 'kind' in data && data.kind === 'fraction-quotient'
        && validLegacy(data as FractionQuotientProblem); } catch { return false; }
}
function validLegacy(data: FractionQuotientProblem): boolean {
    if (!validCommon(data)) return false;
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

    return true;
}

const validUnitOperands = (data: FractionUnitPartitionProblem | FractionUnitSharingProblem): boolean =>
    validCommon(data) && data.orientation === 'unit-fraction-by-whole' && data.dividend.numerator === 1
    && smallCount(data.dividend.denominator, 2, 6) && data.divisor.denominator === 1
    && smallCount(data.divisor.numerator, 2, 6) && data.quotient.numerator === 1
    && data.quotient.denominator === data.dividend.denominator * data.divisor.numerator;

export function isValidFractionUnitPartition(value: unknown): value is FractionUnitPartitionProblem {
    try {
        if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'fraction-unit-partition') return false;
        const data = value as FractionUnitPartitionProblem, model = data.model;
        return validUnitOperands(data) && !!model && model.kind === 'unit-part-sharing'
            && model.wholePartitionCount === data.dividend.denominator && model.recipientCount === data.divisor.numerator
            && model.refinedPartitionCount === model.wholePartitionCount * model.recipientCount
            && model.sharedFineParts === model.recipientCount;
    } catch { return false; }
}

export function isValidFractionUnitSharing(value: unknown): value is FractionUnitSharingProblem {
    try {
        if (!value || typeof value !== 'object' || !('kind' in value) || value.kind !== 'fraction-unit-sharing'
            || ['model', 'wholePartitionCount', 'refinedPartitionCount', 'sharedFineParts'].some(key => key in value)) return false;
        const data = value as FractionUnitSharingProblem;
        return validUnitOperands(data) && data.recipientCount === data.divisor.numerator;
    } catch { return false; }
}

export const isValidFractionPartitionQuotient = (data: unknown): data is FractionPartitionQuotientProblem =>
    isValidFractionQuotient(data) || isValidFractionUnitPartition(data);
export const isValidFractionSharingQuotient = (data: unknown): data is FractionSharingQuotientProblem =>
    isValidFractionQuotient(data) || isValidFractionUnitSharing(data);

export const formatQuotientValue = (value: FractionQuotientValue): string =>
    value.denominator === 1 ? String(value.numerator) : `${value.numerator}/${value.denominator}`;

export const formatOriginalFraction = (value: FractionQuotientValue): string =>
    `${value.numerator}/${value.denominator}`;

export const measure = (value: FractionQuotientValue): string =>
    `${formatQuotientValue(value)} ${value.numerator > 0 && value.numerator <= value.denominator ? 'meter' : 'meters'}`;
