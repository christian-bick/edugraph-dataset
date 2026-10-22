import type {FractionDivisionContext, FractionDivisionRelationProblem, FractionQuotientValue} from '../../../types/problems.ts';

const record = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);
const fraction = (value: unknown): value is FractionQuotientValue => record(value)
    && typeof value.numerator === 'number' && Number.isSafeInteger(value.numerator) && value.numerator >= 0
    && typeof value.denominator === 'number' && Number.isSafeInteger(value.denominator) && value.denominator > 0;
const gcd = (first: number, second: number): number => {
    let a = first;
    let b = second;
    while (b !== 0) [a, b] = [b, a % b];
    return a;
};
const equal = (left: FractionQuotientValue, right: FractionQuotientValue): boolean =>
    BigInt(left.numerator) * BigInt(right.denominator) === BigInt(right.numerator) * BigInt(left.denominator);
const productEquals = (left: FractionQuotientValue, right: FractionQuotientValue, result: FractionQuotientValue): boolean =>
    BigInt(left.numerator) * BigInt(right.numerator) * BigInt(result.denominator)
    === BigInt(result.numerator) * BigInt(left.denominator) * BigInt(right.denominator);
const smallInteger = (value: number, minimum: number, maximum: number): boolean =>
    Number.isSafeInteger(value) && value >= minimum && value <= maximum;
const reduced = (value: FractionQuotientValue): boolean => gcd(value.numerator, value.denominator) === 1;

function validContext(data: FractionDivisionRelationProblem): boolean {
    const context = data.context;
    if (!record(context)) return false;
    if (context.kind === 'rectangle') {
        if (context.lengthUnit !== 'meter' || context.areaUnit !== 'square meter'
            || !fraction(context.area) || !fraction(context.firstSide) || !fraction(context.secondSide)
            || context.area.numerator === 0 || context.firstSide.numerator === 0 || context.secondSide.numerator === 0
            || !equal(context.area, data.dividend) || !equal(context.firstSide, data.divisor)
            || !equal(context.secondSide, data.quotient)) return false;
        const first = BigInt(context.firstSide.numerator) * BigInt(context.secondSide.denominator);
        const second = BigInt(context.secondSide.numerator) * BigInt(context.firstSide.denominator);
        return first <= 6n * second && second <= 6n * first;
    }
    if ((context.kind !== 'sharing' && context.kind !== 'measured-groups')
        || context.material !== 'juice' || context.measureUnit !== 'liter'
        || context.groupUnit !== (context.kind === 'sharing' ? 'batch' : 'serving')
        || !fraction(context.totalMeasure) || !fraction(context.groupCount) || !fraction(context.measurePerGroup)
        || !equal(context.totalMeasure, data.dividend)
        || !productEquals(context.groupCount, context.measurePerGroup, context.totalMeasure)) return false;
    return context.kind === 'sharing'
        ? equal(context.groupCount, data.divisor) && equal(context.measurePerGroup, data.quotient)
        : equal(context.groupCount, data.quotient) && equal(context.measurePerGroup, data.divisor);
}

/** Original roles, exact products, numerical group intervals, and physical contexts must agree. */
export function isValidFractionDivisionRelation(value: unknown): value is FractionDivisionRelationProblem {
    if (!record(value) || value.kind !== 'fraction-division-relation'
        || !['fraction-by-fraction', 'fraction-by-integer', 'integer-by-fraction'].includes(String(value.operandProfile))
        || !fraction(value.dividend) || !fraction(value.divisor) || value.divisor.numerator === 0
        || !fraction(value.quotient) || !reduced(value.quotient)
        || !fraction(value.reciprocal) || !fraction(value.reciprocalProduct)
        || !record(value.inverse) || !fraction(value.inverse.quotientFactor)
        || !fraction(value.inverse.divisorFactor) || !fraction(value.inverse.reconstructedDividend)
        || !record(value.model) || value.model.kind !== 'common-unit-groups'
        || !fraction(value.model.fractionalGroup) || !reduced(value.model.fractionalGroup)
        || !Array.isArray(value.model.groups)) return false;
    const data = value as unknown as FractionDivisionRelationProblem;
    const {dividend, divisor, quotient, model} = data;
    const fractionalRole = (operand: FractionQuotientValue) => [2, 3, 4, 6].includes(operand.denominator);
    if (dividend.numerator > 4 * dividend.denominator || divisor.numerator > 4 * divisor.denominator
        || (data.operandProfile === 'fraction-by-fraction' && (!fractionalRole(dividend) || !fractionalRole(divisor)))
        || (data.operandProfile === 'fraction-by-integer' && (!fractionalRole(dividend) || divisor.denominator !== 1))
        || (data.operandProfile === 'integer-by-fraction' && (dividend.denominator !== 1 || !fractionalRole(divisor)))
        || !productEquals(quotient, divisor, dividend)
        || data.reciprocal.numerator !== divisor.denominator || data.reciprocal.denominator !== divisor.numerator
        || data.reciprocalProduct.numerator !== dividend.numerator * divisor.denominator
        || data.reciprocalProduct.denominator !== dividend.denominator * divisor.numerator
        || !equal(data.reciprocalProduct, quotient)
        || !equal(data.inverse.quotientFactor, quotient) || !equal(data.inverse.divisorFactor, divisor)
        || !equal(data.inverse.reconstructedDividend, dividend)) return false;
    const commonDenominator = dividend.denominator * divisor.denominator / gcd(dividend.denominator, divisor.denominator);
    const dividendTicks = dividend.numerator * commonDenominator / dividend.denominator;
    const divisorTicks = divisor.numerator * commonDenominator / divisor.denominator;
    const completeGroups = Math.floor(dividendTicks / divisorTicks);
    const remainderTicks = dividendTicks % divisorTicks;
    const groupCount = completeGroups + (remainderTicks === 0 ? 0 : 1);
    if (model.ticksPerWhole !== commonDenominator || model.dividendTicks !== dividendTicks
        || model.divisorTicks !== divisorTicks || model.completeGroups !== completeGroups
        || model.remainderTicks !== remainderTicks
        || !equal(model.fractionalGroup, {numerator: remainderTicks, denominator: divisorTicks})
        || !smallInteger(model.coverageTicks, Math.max(divisorTicks, groupCount * divisorTicks), 96)
        || model.groups.length !== groupCount || model.groups.length > 24
        || !model.groups.every((group, index) => record(group)
            && group.startTick === index * divisorTicks && group.endTick === (index + 1) * divisorTicks
            && group.filledTicks === (index < completeGroups ? divisorTicks : remainderTicks))) return false;
    if (!validContext(data)) return false;
    if (data.equationWitness !== undefined) {
        const witness = data.equationWitness;
        if (!record(witness) || !fraction(witness.firstFactor) || !fraction(witness.secondFactor)
            || !fraction(witness.product) || !equal(witness.product, dividend)
            || !productEquals(witness.firstFactor, witness.secondFactor, witness.product)
            || !((equal(witness.firstFactor, quotient) && equal(witness.secondFactor, divisor))
                || (equal(witness.firstFactor, divisor) && equal(witness.secondFactor, quotient)))) return false;
    }
    if (data.multiplicationWitness !== undefined) {
        const witness = data.multiplicationWitness;
        if (!record(witness) || !fraction(witness.unreducedProduct) || !fraction(witness.reconstructedDividend)
            || witness.unreducedProduct.numerator !== quotient.numerator * divisor.numerator
            || witness.unreducedProduct.denominator !== quotient.denominator * divisor.denominator
            || !equal(witness.unreducedProduct, dividend) || !equal(witness.reconstructedDividend, dividend)) return false;
    }
    return true;
}

export const originalDivisionFraction = (value: FractionQuotientValue): string => `${value.numerator}/${value.denominator}`;
export const divisionNumber = (value: FractionQuotientValue): string =>
    value.denominator === 1 ? String(value.numerator) : originalDivisionFraction(value);
export const divisionFactor = (value: FractionQuotientValue): string =>
    value.denominator === 1 ? String(value.numerator) : `(${originalDivisionFraction(value)})`;
export const originalDivisionOperand = (value: FractionQuotientValue): string =>
    value.denominator === 1 ? String(value.numerator) : originalDivisionFraction(value);

export function fractionDivisionStory(data: FractionDivisionRelationProblem): string {
    const {context} = data;
    const dividend = originalDivisionOperand(data.dividend);
    const divisor = originalDivisionOperand(data.divisor);
    if (context.kind === 'sharing') return `${dividend} liters of juice make ${divisor} batches at a constant recipe rate. How many liters are needed for one whole batch?`;
    if (context.kind === 'measured-groups') return `There are ${dividend} liters of juice. One standard serving contains ${divisor} liters. How many standard servings of juice are there? Include any fractional serving.`;
    return `A rectangle has area ${dividend} square meters and one side of length ${divisor} meters. What is the length of its other side in meters?`;
}

export function fractionDivisionAnswerUnit(context: FractionDivisionContext): string {
    return context.kind === 'sharing' ? 'liters per batch'
        : context.kind === 'measured-groups' ? 'standard servings' : 'meters';
}

export function fractionDivisionMeaning(data: FractionDivisionRelationProblem): string {
    const q = divisionNumber(data.quotient);
    const a = originalDivisionOperand(data.dividend);
    const b = originalDivisionOperand(data.divisor);
    if (data.context.kind === 'sharing') return `The quotient ${q} is the amount in liters needed for one whole batch. At that rate, ${b} batches use ${a} liters.`;
    if (data.context.kind === 'measured-groups') return `The quotient ${q} counts standard servings of juice, each containing ${b} liters. Fractional servings are included.`;
    return `The quotient ${q} measures the other side in meters. Multiplying that side by the given ${b}-meter side reconstructs the ${a}-square-meter area.`;
}
