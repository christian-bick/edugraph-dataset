import {
    FractionArithmeticProblem,
    FractionParts,
    LikeDenominatorFractionValue,
    MixedFractionValue
} from '../../../types/problems.ts';

const DENOMINATORS = [2, 3, 4, 6, 8] as const;
const NON_BINARY_DENOMINATORS = [3, 4, 6, 8] as const;
const DECOMPOSITION_DENOMINATORS = [4, 6, 8] as const;

const validDenominator = (value: number): value is FractionParts =>
    DENOMINATORS.includes(value as FractionParts);

const validFraction = (
    value: LikeDenominatorFractionValue,
    denominator: FractionParts,
    minimum = 1
): boolean => typeof value === 'object'
    && value !== null
    && Number.isInteger(value.numerator)
    && value.numerator >= minimum
    && value.denominator === denominator;

const validMixed = (
    value: MixedFractionValue,
    denominator: FractionParts
): boolean => typeof value === 'object'
    && value !== null
    && Number.isInteger(value.whole)
    && value.whole >= 0
    && Number.isInteger(value.numerator)
    && value.numerator >= 0
    && value.numerator < denominator
    && value.denominator === denominator;

const improperNumerator = (value: MixedFractionValue): number =>
    value.whole * value.denominator + value.numerator;

const validCommon = (
    data: Exclude<FractionArithmeticProblem, {task: 'tenths-hundredths-addition'}>
): boolean => validDenominator(data.denominator)
    && data.sharedWhole === 1;

const validBinary = (
    data: Extract<FractionArithmeticProblem, {task: 'fraction-operation'}>
): boolean => validCommon(data)
    && (data.operation === 'addition' || data.operation === 'subtraction')
    && validFraction(data.first, data.denominator)
    && validFraction(data.second, data.denominator)
    && validFraction(data.result, data.denominator)
    && (data.operation === 'addition'
        ? data.first.numerator + data.second.numerator === data.result.numerator
            && data.result.numerator <= data.denominator
        : data.first.numerator - data.second.numerator === data.result.numerator
            && data.first.numerator <= data.denominator
            && data.second.numerator < data.first.numerator);

const validDecomposition = (
    data: Extract<FractionArithmeticProblem, {task: 'decompose'}>
): boolean => {
    if (!validCommon(data)
        || data.operation !== 'addition'
        || typeof data.source !== 'object'
        || data.source === null
        || !Array.isArray(data.decompositions)
        || data.decompositions.length !== 2) return false;
    const validSource = data.source.kind === 'proper'
        ? DECOMPOSITION_DENOMINATORS.includes(data.denominator as 4 | 6 | 8)
            && validFraction(data.source.value, data.denominator, 3)
            && data.source.value.numerator < data.denominator
        : data.source.kind === 'mixed'
            && validMixed(data.source.value, data.denominator)
            && data.source.value.whole === 2
            && data.source.value.numerator > 0;
    if (!validSource) return false;
    const sourceNumerator = data.source.kind === 'proper'
        ? data.source.value.numerator
        : improperNumerator(data.source.value);
    const numeratorSets = data.decompositions.map(decomposition => {
        if (typeof decomposition !== 'object'
            || decomposition === null
            || !Array.isArray(decomposition.terms)
            || decomposition.terms.length < 2
            || !decomposition.terms.every(term => validFraction(term, data.denominator))) {
            return null;
        }
        return decomposition.terms.map(term => term.numerator);
    });
    return numeratorSets.every(numerators =>
        numerators !== null
        && numerators.reduce((sum, numerator) => sum + numerator, 0) === sourceNumerator
    ) && JSON.stringify(numeratorSets[0]) !== JSON.stringify(numeratorSets[1]);
};

const validMixedOperation = (
    data: Extract<FractionArithmeticProblem, {task: 'mixed-operation'}>
): boolean => {
    if (!validCommon(data)
        || !NON_BINARY_DENOMINATORS.includes(data.denominator as 3 | 4 | 6 | 8)
        || (data.operation !== 'addition' && data.operation !== 'subtraction')
        || !validMixed(data.first, data.denominator)
        || !validMixed(data.second, data.denominator)
        || !validMixed(data.result, data.denominator)
        || data.first.numerator === 0
        || data.second.numerator === 0) return false;
    const expected = data.operation === 'addition'
        ? improperNumerator(data.first) + improperNumerator(data.second)
        : improperNumerator(data.first) - improperNumerator(data.second);
    return (data.operation === 'addition'
        ? data.first.whole === 1 && data.second.whole === 1
        : data.first.whole === 2 && data.second.whole === 1 && expected > 0)
        && improperNumerator(data.result) === expected;
};

const validUnitFractionMultiple = (
    data: Extract<FractionArithmeticProblem, {task: 'unit-fraction-multiple'}>
): boolean => validCommon(data)
    && data.operation === 'multiplication'
    && Number.isInteger(data.wholeFactor)
    && data.wholeFactor >= 2
    && data.wholeFactor <= 4
    && validFraction(data.unitFraction, data.denominator)
    && data.unitFraction.numerator === 1
    && validFraction(data.product, data.denominator)
    && data.product.numerator === data.wholeFactor;

const validWholeNumberFractionProduct = (
    data: Extract<FractionArithmeticProblem, {task: 'whole-number-fraction-product'}>
): boolean => validCommon(data)
    && data.operation === 'multiplication'
    && Number.isInteger(data.wholeFactor)
    && data.wholeFactor >= 2
    && data.wholeFactor <= 4
    && validFraction(data.fractionFactor, data.denominator, 2)
    && data.fractionFactor.numerator < data.denominator
    && validFraction(data.product, data.denominator)
    && data.product.numerator === data.wholeFactor * data.fractionFactor.numerator
    && data.product.numerator <= 4 * data.denominator
    && data.product.numerator % data.denominator !== 0;

const validTenthsHundredthsAddition = (
    data: Extract<FractionArithmeticProblem, {task: 'tenths-hundredths-addition'}>
): boolean => typeof data.firstTenths === 'object'
    && data.firstTenths !== null
    && typeof data.secondHundredths === 'object'
    && data.secondHundredths !== null
    && typeof data.convertedFirst === 'object'
    && data.convertedFirst !== null
    && typeof data.result === 'object'
    && data.result !== null
    && data.operation === 'addition'
    && data.denominator === 100
    && data.sharedWhole === 1
    && data.conversionFactor === 10
    && data.firstTenths.denominator === 10
    && Number.isInteger(data.firstTenths.numerator)
    && data.firstTenths.numerator >= 1
    && data.firstTenths.numerator <= 9
    && data.secondHundredths.denominator === 100
    && Number.isInteger(data.secondHundredths.numerator)
    && data.secondHundredths.numerator >= 1
    && data.convertedFirst.denominator === 100
    && data.convertedFirst.numerator === data.firstTenths.numerator * data.conversionFactor
    && data.result.denominator === 100
    && data.result.numerator === data.convertedFirst.numerator + data.secondHundredths.numerator
    && data.result.numerator <= 100;

export const isValidFractionArithmeticProblem = (data: FractionArithmeticProblem): boolean => {
    if (typeof data !== 'object' || data === null) return false;
    switch (data.task) {
        case 'fraction-operation': return validBinary(data);
        case 'decompose': return validDecomposition(data);
        case 'mixed-operation': return validMixedOperation(data);
        case 'unit-fraction-multiple': return validUnitFractionMultiple(data);
        case 'whole-number-fraction-product': return validWholeNumberFractionProduct(data);
        case 'tenths-hundredths-addition': return validTenthsHundredthsAddition(data);
        default: return false;
    }
};
