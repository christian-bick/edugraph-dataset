import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import {formatStandardNumeral} from '../../../lib/whole-number-notation.ts';
import {
    MultiplicationOperandDecomposition,
    MultiDigitMultiplicationProblem
} from '../../../types/problems.ts';
import {MultiDigitMultiplicationGenerator} from './generator.ts';
import {OperandDigitProfile} from './spec.ts';

const profiles = [
    ['one-by-one', 1, 1],
    ['one-by-two', 1, 2],
    ['one-by-three', 1, 3],
    ['one-by-four', 1, 4],
    ['two-by-two', 2, 2]
] as const satisfies readonly [OperandDigitProfile, 1 | 2, 1 | 2 | 3 | 4][];

const expectValidDecomposition = (decomposition: MultiplicationOperandDecomposition): void => {
    expect(decomposition.parts).toHaveLength(String(decomposition.operand).length);
    expect(decomposition.parts.reduce((sum, part) => sum + part.value, 0))
        .toBe(decomposition.operand);
    expect(decomposition.parts.map(part => part.placeValue))
        .toEqual(Array.from(
            {length: decomposition.parts.length},
            (_, index) => 10 ** (decomposition.parts.length - index - 1)
        ));
    for (const part of decomposition.parts) {
        expect(part.digit).toBeGreaterThanOrEqual(1);
        expect(part.digit).toBeLessThanOrEqual(9);
        expect(part.value).toBe(part.digit * part.placeValue);
    }
    const expression = decomposition.parts
        .map(part => formatStandardNumeral(part.value))
        .join(' + ');
    expect(decomposition.expandedExpression).toBe(expression);
    expect(decomposition.equation)
        .toBe(`${formatStandardNumeral(decomposition.operand)} = ${expression}`);
};

const expectConsistentProblem = (problem: MultiDigitMultiplicationProblem): void => {
    expect(problem.task).toBe('multi-digit-multiplication');
    expect(problem.smallestOperand).toBeLessThanOrEqual(problem.largestOperand);
    expect(String(problem.smallestOperand)).toHaveLength(problem.smallestOperandDigits);
    expect(String(problem.largestOperand)).toHaveLength(problem.largestOperandDigits);
    expect(String(problem.smallestOperand)).not.toContain('0');
    expect(String(problem.largestOperand)).not.toContain('0');
    expectValidDecomposition(problem.smallestDecomposition);
    expectValidDecomposition(problem.largestDecomposition);
    expect(problem.smallestDecomposition.operand).toBe(problem.smallestOperand);
    expect(problem.largestDecomposition.operand).toBe(problem.largestOperand);

    const expectedPairs = problem.smallestDecomposition.parts.flatMap(smallestPart =>
        problem.largestDecomposition.parts.map(largestPart => ({largestPart, smallestPart}))
    );
    expect(problem.partialProducts).toHaveLength(expectedPairs.length);
    problem.partialProducts.forEach((partialProduct, index) => {
        expect(partialProduct.largestPart).toEqual(expectedPairs[index]!.largestPart);
        expect(partialProduct.smallestPart).toEqual(expectedPairs[index]!.smallestPart);
        expect(partialProduct.product).toBe(
            partialProduct.largestPart.value * partialProduct.smallestPart.value
        );
        const factors = `${formatStandardNumeral(partialProduct.largestPart.value)} × ${formatStandardNumeral(partialProduct.smallestPart.value)}`;
        expect(partialProduct.questionEquation).toBe(`${factors} = ?`);
        expect(partialProduct.solutionEquation)
            .toBe(`${factors} = ${formatStandardNumeral(partialProduct.product)}`);
    });

    expect(problem.product).toBe(problem.largestOperand * problem.smallestOperand);
    expect(problem.partialProducts.reduce((sum, item) => sum + item.product, 0))
        .toBe(problem.product);
    const largestText = formatStandardNumeral(problem.largestOperand);
    const smallestText = formatStandardNumeral(problem.smallestOperand);
    const productText = formatStandardNumeral(problem.product);
    const partialProductsExpression = problem.partialProducts
        .map(item => formatStandardNumeral(item.product))
        .join(' + ');
    expect(problem.prompt)
        .toBe(`Multiply ${largestText} by ${smallestText} using place-value partial products.`);
    expect(problem.questionEquation).toBe(`${largestText} × ${smallestText} = ?`);
    expect(problem.solutionEquation).toBe(`${largestText} × ${smallestText} = ${productText}`);
    expect(problem.partialProductsSumEquation)
        .toBe(`${partialProductsExpression} = ${productText}`);
    expect(problem.explanation).toBe(
        `Decompose ${largestText} as ${problem.largestDecomposition.expandedExpression} and ${smallestText} as ${problem.smallestDecomposition.expandedExpression}. Multiply each pair of place-value parts, then add the partial products: ${problem.partialProductsSumEquation}. Therefore, ${problem.solutionEquation}.`
    );
};

describe('MultiDigitMultiplicationGenerator', () => {
    const generator = new MultiDigitMultiplicationGenerator();

    it('strictly validates its operand profile', () => {
        expect(() => generator.generate({})).toThrow();
        expect(() => generator.generate({operandDigitProfile: 'unsupported'} as never))
            .toThrow('Unsupported operand digit profile "unsupported".');
    });

    it.each(profiles)('generates consistent %s place-value evidence', (
        operandDigitProfile,
        smallestOperandDigits,
        largestOperandDigits
    ) => {
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const problem = generator.generate({operandDigitProfile}).data;
            expect(problem.smallestOperandDigits).toBe(smallestOperandDigits);
            expect(problem.largestOperandDigits).toBe(largestOperandDigits);
            expectConsistentProblem(problem);
        }
    });

    it.each(profiles)('is deterministic for %s', (
        operandDigitProfile,
        _smallestOperandDigits,
        _largestOperandDigits
    ) => {
        setSeed(`multi-digit-multiplication-${operandDigitProfile}`);
        const first = generator.generate({operandDigitProfile});
        setSeed(`multi-digit-multiplication-${operandDigitProfile}`);
        expect(generator.generate({operandDigitProfile})).toEqual(first);
    });

    it('never introduces zero through operand digits or partial products', () => {
        for (const [operandDigitProfile] of profiles) {
            for (let seed = 0; seed < 500; seed++) {
                setSeed(`${operandDigitProfile}-${seed}`);
                const problem = generator.generate({operandDigitProfile}).data;
                expect(String(problem.smallestOperand)).not.toContain('0');
                expect(String(problem.largestOperand)).not.toContain('0');
                expect(problem.smallestDecomposition.parts.every(part => part.value > 0))
                    .toBe(true);
                expect(problem.largestDecomposition.parts.every(part => part.value > 0))
                    .toBe(true);
                expect(problem.partialProducts.every(partialProduct => partialProduct.product > 0))
                    .toBe(true);
            }
        }
    });
});
