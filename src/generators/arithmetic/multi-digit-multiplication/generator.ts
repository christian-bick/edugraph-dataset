import {GeneratorValidationError, validateConfigFields} from '../../../lib/errors.ts';
import {random} from '../../../lib/random.ts';
import {AbstractProblem, ProblemGenerator, ProblemStub} from '../../../types/ml-engine.ts';
import {multiplicationDomain, profileDigits} from './domain.ts';
import {
    MultiDigitMultiplicationProblem,
    MultiplicationOperandDecomposition,
    MultiplicationPartialProduct,
    MultiplicationPlaceValuePart
} from '../../../types/problems.ts';
import {
    MultiDigitMultiplicationGeneratorConfig,
    MultiDigitMultiplicationGeneratorSchema
} from './spec.ts';

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
        validateConfigFields('multi-digit-multiplication', config, ['operandDigitProfile', 'range']);

        const digits = profileDigits[config.operandDigitProfile!];
        if (!digits) {
            throw new GeneratorValidationError(
                'multi-digit-multiplication',
                `Unsupported operand digit profile "${config.operandDigitProfile}".`
            );
        }

        const domain = multiplicationDomain(config.operandDigitProfile!, config.range!);
        if (!domain.length) throw new GeneratorValidationError('multi-digit-multiplication', 'Expected a feasible operand/range profile.');
        const [smallestOperand, largestOperand] = domain[Math.floor(random() * domain.length)]!;
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
