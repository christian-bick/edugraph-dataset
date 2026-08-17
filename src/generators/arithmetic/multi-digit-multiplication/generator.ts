import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {formatStandardNumeral} from '../../../lib/whole-number-notation.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {
    MultiDigitMultiplicationProblem,
    MultiplicationOperandDecomposition,
    MultiplicationPartialProduct,
    MultiplicationPlaceValuePart
} from '../../../types/problems.ts';
import {
    MultiDigitMultiplicationGeneratorConfig,
    MultiDigitMultiplicationGeneratorSchema,
    OperandDigitProfile
} from './spec.ts';

const profileDigits: Readonly<Record<OperandDigitProfile, {
    smallest: 1 | 2;
    largest: 1 | 2 | 3 | 4;
}>> = {
    'one-by-one': {smallest: 1, largest: 1},
    'one-by-two': {smallest: 1, largest: 2},
    'one-by-three': {smallest: 1, largest: 3},
    'one-by-four': {smallest: 1, largest: 4},
    'two-by-two': {smallest: 2, largest: 2}
};

const placeNames = new Map<MultiplicationPlaceValuePart['placeValue'],
    MultiplicationPlaceValuePart['placeName']>([
        [1, 'ones'],
        [10, 'tens'],
        [100, 'hundreds'],
        [1000, 'thousands']
    ]);

const randomNonZeroDigit = (): number => 1 + Math.floor(random() * 9);

const randomOperand = (digitCount: 1 | 2 | 3 | 4): number => {
    let operand = 0;
    for (let index = 0; index < digitCount; index++) {
        operand = operand * 10 + randomNonZeroDigit();
    }
    return operand;
};

const buildDecomposition = (operand: number): MultiplicationOperandDecomposition => {
    const digits = String(operand).split('').map(Number);
    const parts = digits.map((digit, index): MultiplicationPlaceValuePart => {
        const placeValue = (10 ** (digits.length - index - 1)) as MultiplicationPlaceValuePart['placeValue'];
        return {
            digit,
            placeValue,
            placeName: placeNames.get(placeValue)!,
            value: digit * placeValue
        };
    });
    const operandText = formatStandardNumeral(operand);
    const expandedExpression = parts
        .map(part => formatStandardNumeral(part.value))
        .join(' + ');

    return {
        operand,
        parts,
        expandedExpression,
        equation: `${operandText} = ${expandedExpression}`
    };
};

const buildPartialProducts = (
    largestDecomposition: MultiplicationOperandDecomposition,
    smallestDecomposition: MultiplicationOperandDecomposition
): MultiplicationPartialProduct[] => smallestDecomposition.parts.flatMap(smallestPart =>
    largestDecomposition.parts.map(largestPart => {
        const product = largestPart.value * smallestPart.value;
        const factors = `${formatStandardNumeral(largestPart.value)} × ${formatStandardNumeral(smallestPart.value)}`;
        return {
            largestPart,
            smallestPart,
            product,
            questionEquation: `${factors} = ?`,
            solutionEquation: `${factors} = ${formatStandardNumeral(product)}`
        };
    })
);

export class MultiDigitMultiplicationGenerator implements ProblemGenerator<
    MultiDigitMultiplicationProblem,
    MultiDigitMultiplicationGeneratorConfig
> {
    type: AbstractProblem['type'] = 'arithmetic';
    schema = MultiDigitMultiplicationGeneratorSchema;

    generate(
        config: MultiDigitMultiplicationGeneratorConfig
    ): ProblemStub<MultiDigitMultiplicationProblem> {
        validateConfigFields('multi-digit-multiplication', config, ['operandDigitProfile']);

        const digits = profileDigits[config.operandDigitProfile!];
        if (!digits) {
            throw new GeneratorValidationError(
                'multi-digit-multiplication',
                `Unsupported operand digit profile "${config.operandDigitProfile}".`
            );
        }

        const sampledSmallest = randomOperand(digits.smallest);
        const sampledLargest = randomOperand(digits.largest);
        const smallestOperand = Math.min(sampledSmallest, sampledLargest);
        const largestOperand = Math.max(sampledSmallest, sampledLargest);
        const smallestDecomposition = buildDecomposition(smallestOperand);
        const largestDecomposition = buildDecomposition(largestOperand);
        const partialProducts = buildPartialProducts(
            largestDecomposition,
            smallestDecomposition
        );
        const product = largestOperand * smallestOperand;
        const largestText = formatStandardNumeral(largestOperand);
        const smallestText = formatStandardNumeral(smallestOperand);
        const productText = formatStandardNumeral(product);
        const partialProductsExpression = partialProducts
            .map(partialProduct => formatStandardNumeral(partialProduct.product))
            .join(' + ');
        const solutionEquation = `${largestText} × ${smallestText} = ${productText}`;
        const partialProductsSumEquation = `${partialProductsExpression} = ${productText}`;

        return {
            data: {
                task: 'multi-digit-multiplication',
                largestOperand,
                smallestOperand,
                largestOperandDigits: digits.largest,
                smallestOperandDigits: digits.smallest,
                largestDecomposition,
                smallestDecomposition,
                partialProducts,
                product,
                prompt: `Multiply ${largestText} by ${smallestText} using place-value partial products.`,
                questionEquation: `${largestText} × ${smallestText} = ?`,
                solutionEquation,
                partialProductsSumEquation,
                explanation: `Decompose ${largestText} as ${largestDecomposition.expandedExpression} and ${smallestText} as ${smallestDecomposition.expandedExpression}. Multiply each pair of place-value parts, then add the partial products: ${partialProductsSumEquation}. Therefore, ${solutionEquation}.`
            }
        };
    }
}
