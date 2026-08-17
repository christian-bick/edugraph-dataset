import {describe, expect, it} from 'vitest';
import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {
    MultiDigitMultiplicationProblem,
    MultiplicationOperandDecomposition,
    MultiplicationPlaceValuePart
} from '../../../../types/problems.ts';
import {isValidMultiDigitMultiplicationProblem} from './helpers.ts';

const placeNames = new Map<MultiplicationPlaceValuePart['placeValue'],
    MultiplicationPlaceValuePart['placeName']>([
        [1, 'ones'],
        [10, 'tens'],
        [100, 'hundreds'],
        [1000, 'thousands']
    ]);

const decompose = (operand: number): MultiplicationOperandDecomposition => {
    const digits = String(operand).split('').map(Number);
    const parts = digits.map((digit, index): MultiplicationPlaceValuePart => {
        const placeValue = (10 ** (digits.length - index - 1)) as MultiplicationPlaceValuePart['placeValue'];
        return {digit, placeValue, placeName: placeNames.get(placeValue)!, value: digit * placeValue};
    });
    const expandedExpression = parts.map(part => formatStandardNumeral(part.value)).join(' + ');
    return {
        operand,
        parts,
        expandedExpression,
        equation: `${formatStandardNumeral(operand)} = ${expandedExpression}`
    };
};

const problemFor = (first: number, second: number): MultiDigitMultiplicationProblem => {
    const largestOperand = Math.max(first, second);
    const smallestOperand = Math.min(first, second);
    const largestDecomposition = decompose(largestOperand);
    const smallestDecomposition = decompose(smallestOperand);
    const partialProducts = smallestDecomposition.parts.flatMap(smallestPart =>
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
    const product = largestOperand * smallestOperand;
    const largestText = formatStandardNumeral(largestOperand);
    const smallestText = formatStandardNumeral(smallestOperand);
    const productText = formatStandardNumeral(product);
    const solutionEquation = `${largestText} × ${smallestText} = ${productText}`;
    const partialProductsSumEquation = `${partialProducts.map(item => formatStandardNumeral(item.product)).join(' + ')} = ${productText}`;
    return {
        task: 'multi-digit-multiplication',
        largestOperand,
        smallestOperand,
        largestOperandDigits: String(largestOperand).length as 1 | 2 | 3 | 4,
        smallestOperandDigits: String(smallestOperand).length as 1 | 2,
        largestDecomposition,
        smallestDecomposition,
        partialProducts,
        product,
        prompt: `Multiply ${largestText} by ${smallestText} using place-value partial products.`,
        questionEquation: `${largestText} × ${smallestText} = ?`,
        solutionEquation,
        partialProductsSumEquation,
        explanation: `Decompose ${largestText} as ${largestDecomposition.expandedExpression} and ${smallestText} as ${smallestDecomposition.expandedExpression}. Multiply each pair of place-value parts, then add the partial products: ${partialProductsSumEquation}. Therefore, ${solutionEquation}.`
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
        ['leaking cell question', () => {
            const problem = problemFor(876, 5);
            const partialProducts = [...problem.partialProducts];
            partialProducts[0] = {
                ...partialProducts[0]!,
                questionEquation: partialProducts[0]!.solutionEquation
            };
            return {...problem, partialProducts};
        }],
        ['wrong explanation', () => ({...problemFor(876, 5), explanation: 'Add the products.'})]
    ])('rejects %s', (_description, build) => {
        expect(isValidMultiDigitMultiplicationProblem(
            build() as MultiDigitMultiplicationProblem
        )).toBe(false);
    });
});
