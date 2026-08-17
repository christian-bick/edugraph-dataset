import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {
    MultiDigitMultiplicationProblem,
    MultiplicationOperandDecomposition,
    MultiplicationPlaceValuePart
} from '../../../../types/problems.ts';

const PLACE_NAMES = new Map<
    MultiplicationPlaceValuePart['placeValue'],
    MultiplicationPlaceValuePart['placeName']
>([
    [1, 'ones'],
    [10, 'tens'],
    [100, 'hundreds'],
    [1000, 'thousands']
]);

const hasOnlyNonZeroDigits = (value: number): boolean =>
    Number.isSafeInteger(value)
    && value > 0
    && !String(value).includes('0');

const samePart = (
    actual: MultiplicationPlaceValuePart,
    expected: MultiplicationPlaceValuePart
): boolean => actual.digit === expected.digit
    && actual.placeValue === expected.placeValue
    && actual.placeName === expected.placeName
    && actual.value === expected.value;

const expectedParts = (operand: number): MultiplicationPlaceValuePart[] =>
    String(operand).split('').map((character, index, digits) => {
        const digit = Number(character);
        const placeValue = (10 ** (digits.length - index - 1)) as MultiplicationPlaceValuePart['placeValue'];
        return {
            digit,
            placeValue,
            placeName: PLACE_NAMES.get(placeValue)!,
            value: digit * placeValue
        };
    });

const isValidDecomposition = (
    decomposition: MultiplicationOperandDecomposition,
    operand: number
): boolean => {
    if (decomposition.operand !== operand || !Array.isArray(decomposition.parts)) return false;
    const parts = expectedParts(operand);
    if (decomposition.parts.length !== parts.length) return false;
    if (!decomposition.parts.every((part, index) => samePart(part, parts[index]!))) return false;

    const expandedExpression = parts
        .map(part => formatStandardNumeral(part.value))
        .join(' + ');
    return decomposition.expandedExpression === expandedExpression
        && decomposition.equation
            === `${formatStandardNumeral(operand)} = ${expandedExpression}`;
};

export const isValidMultiDigitMultiplicationProblem = (
    data: MultiDigitMultiplicationProblem
): boolean => {
    if (data.task !== 'multi-digit-multiplication') return false;
    if (!hasOnlyNonZeroDigits(data.largestOperand)
        || !hasOnlyNonZeroDigits(data.smallestOperand)
        || data.largestOperand > 9999
        || data.smallestOperand > 99
        || data.largestOperand < data.smallestOperand) return false;

    const largestDigits = String(data.largestOperand).length;
    const smallestDigits = String(data.smallestOperand).length;
    if (data.largestOperandDigits !== largestDigits
        || data.smallestOperandDigits !== smallestDigits
        || largestDigits < 1
        || largestDigits > 4
        || smallestDigits < 1
        || smallestDigits > 2
        || smallestDigits > largestDigits) return false;

    if (!isValidDecomposition(data.largestDecomposition, data.largestOperand)
        || !isValidDecomposition(data.smallestDecomposition, data.smallestOperand)
        || !Array.isArray(data.partialProducts)) return false;

    const expectedPairs = data.smallestDecomposition.parts.flatMap(smallestPart =>
        data.largestDecomposition.parts.map(largestPart => ({largestPart, smallestPart}))
    );
    if (data.partialProducts.length !== expectedPairs.length) return false;

    for (let index = 0; index < expectedPairs.length; index++) {
        const partialProduct = data.partialProducts[index]!;
        const expected = expectedPairs[index]!;
        if (!samePart(partialProduct.largestPart, expected.largestPart)
            || !samePart(partialProduct.smallestPart, expected.smallestPart)) return false;

        const product = expected.largestPart.value * expected.smallestPart.value;
        const factors = `${formatStandardNumeral(expected.largestPart.value)} × ${formatStandardNumeral(expected.smallestPart.value)}`;
        if (!Number.isSafeInteger(partialProduct.product)
            || partialProduct.product <= 0
            || partialProduct.product !== product
            || partialProduct.questionEquation !== `${factors} = ?`
            || partialProduct.solutionEquation
                !== `${factors} = ${formatStandardNumeral(product)}`) return false;
    }

    const product = data.largestOperand * data.smallestOperand;
    if (!Number.isSafeInteger(data.product)
        || data.product <= 0
        || data.product !== product
        || data.partialProducts.reduce((sum, item) => sum + item.product, 0) !== product) {
        return false;
    }

    const largestText = formatStandardNumeral(data.largestOperand);
    const smallestText = formatStandardNumeral(data.smallestOperand);
    const productText = formatStandardNumeral(product);
    const factors = `${largestText} × ${smallestText}`;
    const partialProductsExpression = data.partialProducts
        .map(item => formatStandardNumeral(item.product))
        .join(' + ');
    const sumEquation = `${partialProductsExpression} = ${productText}`;
    const solutionEquation = `${factors} = ${productText}`;
    const explanation = `Decompose ${largestText} as ${data.largestDecomposition.expandedExpression} and ${smallestText} as ${data.smallestDecomposition.expandedExpression}. Multiply each pair of place-value parts, then add the partial products: ${sumEquation}. Therefore, ${solutionEquation}.`;

    return data.prompt
            === `Multiply ${largestText} by ${smallestText} using place-value partial products.`
        && data.questionEquation === `${factors} = ?`
        && data.solutionEquation === solutionEquation
        && data.partialProductsSumEquation === sumEquation
        && data.explanation === explanation;
};
