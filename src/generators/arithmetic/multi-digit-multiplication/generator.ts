import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
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
            value: digit * placeValue
        };
    });

    return {
        operand,
        parts
    };
};

const buildPartialProducts = (
    largestDecomposition: MultiplicationOperandDecomposition,
    smallestDecomposition: MultiplicationOperandDecomposition
): MultiplicationPartialProduct[] => smallestDecomposition.parts.flatMap(smallestPart =>
    largestDecomposition.parts.map(largestPart => {
        const product = largestPart.value * smallestPart.value;
        return {
            largestPart,
            smallestPart,
            product
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
                product
            }
        };
    }
}
