import {describe, expect, it} from 'vitest';
import {
    MultiDigitMultiplicationProblem,
    MultiplicationOperandDecomposition,
    MultiplicationPlaceValuePart
} from '../../../../types/problems.ts';
import {
    isValidMultiDigitMultiplicationProblem,
    multiDigitMultiplicationPresentation
} from './helpers.ts';

const decompose = (operand: number): MultiplicationOperandDecomposition => {
    const digits = String(operand).split('').map(Number);
    const parts = digits.map((digit, index): MultiplicationPlaceValuePart => {
        const placeValue = (10 ** (digits.length - index - 1)) as MultiplicationPlaceValuePart['placeValue'];
        return {digit, placeValue, value: digit * placeValue};
    });
    return {operand, parts};
};

const problemFor = (first: number, second: number): MultiDigitMultiplicationProblem => {
    const largestOperand = Math.max(first, second);
    const smallestOperand = Math.min(first, second);
    const largestDecomposition = decompose(largestOperand);
    const smallestDecomposition = decompose(smallestOperand);
    const partialProducts = smallestDecomposition.parts.flatMap(smallestPart =>
        largestDecomposition.parts.map(largestPart => {
            const product = largestPart.value * smallestPart.value;
            return {
                largestPart,
                smallestPart,
                product
            };
        })
    );
    const product = largestOperand * smallestOperand;
    return {
        task: 'multi-digit-multiplication',
        largestOperand,
        smallestOperand,
        largestOperandDigits: String(largestOperand).length as 1 | 2 | 3 | 4,
        smallestOperandDigits: String(smallestOperand).length as 1 | 2,
        largestDecomposition,
        smallestDecomposition,
        partialProducts,
        product
    };
};

describe('operations-multiplication-area-model validation', () => {
    it.each([
        [9, 7, 1],
        [87, 6, 2],
        [876, 5, 3],
        [8765, 4, 4],
        [87, 65, 4]
    ])('accepts the authored %i × %i profile with %i cells', (largest, smallest, cells) => {
        const problem = problemFor(largest, smallest);
        expect(problem.partialProducts).toHaveLength(cells);
        expect(isValidMultiDigitMultiplicationProblem(problem)).toBe(true);
    });

    it('accepts the physical maximum two-row by four-column grid', () => {
        const problem = problemFor(9999, 99);
        expect(problem.partialProducts).toHaveLength(8);
        expect(problem.product).toBe(989901);
        expect(isValidMultiDigitMultiplicationProblem(problem)).toBe(true);
    });

    it('derives the complete area-model presentation from typed numeric evidence', () => {
        const presentation = multiDigitMultiplicationPresentation(problemFor(87, 65));
        expect(presentation).toMatchObject({
            prompt: 'Multiply 87 by 65 using place-value partial products.',
            questionEquation: '87 × 65 = ?',
            solutionEquation: '87 × 65 = 5,655',
            partialProductsSumEquation: '4,800 + 420 + 400 + 35 = 5,655',
            explanation: 'Decompose 87 as 80 + 7 and 65 as 60 + 5. Multiply each pair of place-value parts, then add the partial products: 4,800 + 420 + 400 + 35 = 5,655. Therefore, 87 × 65 = 5,655.'
        });
        expect(presentation.largestDecomposition.equation).toBe('87 = 80 + 7');
        expect(presentation.partialProducts[0]).toMatchObject({
            questionEquation: '80 × 60 = ?',
            solutionEquation: '80 × 60 = 4,800'
        });
    });

    it.each([
        ['zero digit', () => problemFor(4021, 7)],
        ['missing region', () => {
            const problem = problemFor(8765, 4);
            return {...problem, partialProducts: problem.partialProducts.slice(1)};
        }],
        ['wrong row-major order', () => {
            const problem = problemFor(87, 65);
            return {...problem, partialProducts: [...problem.partialProducts].reverse()};
        }],
        ['wrong cell product', () => {
            const problem = problemFor(876, 5);
            const partialProducts = [...problem.partialProducts];
            partialProducts[0] = {...partialProducts[0]!, product: 1};
            return {...problem, partialProducts};
        }],
        ['wrong place-value identity', () => {
            const problem = problemFor(876, 5);
            const parts = [...problem.largestDecomposition.parts];
            parts[0] = {...parts[0]!, placeValue: 10};
            return {
                ...problem,
                largestDecomposition: {...problem.largestDecomposition, parts}
            };
        }]
    ])('rejects %s', (_description, build) => {
        expect(isValidMultiDigitMultiplicationProblem(
            build() as MultiDigitMultiplicationProblem
        )).toBe(false);
    });
});
