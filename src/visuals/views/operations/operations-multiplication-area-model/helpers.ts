import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {
    MultiDigitMultiplicationProblem,
    MultiplicationOperandDecomposition,
    MultiplicationPlaceValuePart
} from '../../../../types/problems.ts';

const PLACE_NAMES = new Map<
    MultiplicationPlaceValuePart['placeValue'],
    string
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
    && actual.value === expected.value;

const expectedParts = (operand: number): MultiplicationPlaceValuePart[] =>
    String(operand).split('').map((character, index, digits) => {
        const digit = Number(character);
        const placeValue = (10 ** (digits.length - index - 1)) as MultiplicationPlaceValuePart['placeValue'];
        return {
            digit,
            placeValue,
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

    return true;
};

export type MultiplicationDisplayPart = MultiplicationPlaceValuePart & {
    placeName: string;
};

export type MultiplicationDisplayDecomposition = {
    operand: number;
    parts: readonly MultiplicationDisplayPart[];
    expandedExpression: string;
    equation: string;
};

export type MultiplicationDisplayPartialProduct = {
    largestPart: MultiplicationDisplayPart;
    smallestPart: MultiplicationDisplayPart;
    product: number;
    questionEquation: string;
    solutionEquation: string;
};

export type MultiDigitMultiplicationPresentation = {
    largestDecomposition: MultiplicationDisplayDecomposition;
    smallestDecomposition: MultiplicationDisplayDecomposition;
    partialProducts: readonly MultiplicationDisplayPartialProduct[];
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    partialProductsSumEquation: string;
    explanation: string;
};

const decompositionPresentation = (
    decomposition: MultiplicationOperandDecomposition
): MultiplicationDisplayDecomposition => {
    const parts = decomposition.parts.map(part => ({
        ...part,
        placeName: PLACE_NAMES.get(part.placeValue)!
    }));
    const expandedExpression = parts
        .map(part => formatStandardNumeral(part.value))
        .join(' + ');
    return {
        operand: decomposition.operand,
        parts,
        expandedExpression,
        equation: `${formatStandardNumeral(decomposition.operand)} = ${expandedExpression}`
    };
};

export const multiDigitMultiplicationPresentation = (
    data: MultiDigitMultiplicationProblem
): MultiDigitMultiplicationPresentation => {
    const largestDecomposition = decompositionPresentation(data.largestDecomposition);
    const smallestDecomposition = decompositionPresentation(data.smallestDecomposition);
    const partialProducts = data.partialProducts.map(partialProduct => {
        const largestPart = {
            ...partialProduct.largestPart,
            placeName: PLACE_NAMES.get(partialProduct.largestPart.placeValue)!
        };
        const smallestPart = {
            ...partialProduct.smallestPart,
            placeName: PLACE_NAMES.get(partialProduct.smallestPart.placeValue)!
        };
        const factors = `${formatStandardNumeral(largestPart.value)} × ${formatStandardNumeral(smallestPart.value)}`;
        return {
            largestPart,
            smallestPart,
            product: partialProduct.product,
            questionEquation: `${factors} = ?`,
            solutionEquation: `${factors} = ${formatStandardNumeral(partialProduct.product)}`
        };
    });
    const largestText = formatStandardNumeral(data.largestOperand);
    const smallestText = formatStandardNumeral(data.smallestOperand);
    const productText = formatStandardNumeral(data.product);
    const factors = `${largestText} × ${smallestText}`;
    const partialProductsSumEquation = `${partialProducts.map(item =>
        formatStandardNumeral(item.product)).join(' + ')} = ${productText}`;
    const solutionEquation = `${factors} = ${productText}`;

    return {
        largestDecomposition,
        smallestDecomposition,
        partialProducts,
        prompt: `Multiply ${largestText} by ${smallestText} using place-value partial products.`,
        questionEquation: `${factors} = ?`,
        solutionEquation,
        partialProductsSumEquation,
        explanation: `Decompose ${largestText} as ${largestDecomposition.expandedExpression} and ${smallestText} as ${smallestDecomposition.expandedExpression}. Multiply each pair of place-value parts, then add the partial products: ${partialProductsSumEquation}. Therefore, ${solutionEquation}.`
    };
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
        if (!Number.isSafeInteger(partialProduct.product)
            || partialProduct.product <= 0
            || partialProduct.product !== product) return false;
    }

    const product = data.largestOperand * data.smallestOperand;
    if (!Number.isSafeInteger(data.product)
        || data.product <= 0
        || data.product !== product
        || data.partialProducts.reduce((sum, item) => sum + item.product, 0) !== product) {
        return false;
    }

    return true;
};
