import {describe, expect, it} from 'vitest';
import {
    DivisionOperandDecomposition,
    DivisionPartialQuotientStep,
    DivisionPlaceValuePart,
    MultiDigitDivisionProblem
} from '../../../../types/problems.ts';
import {
    isValidMultiDigitDivisionProblem,
    multiDigitDivisionPresentation
} from './helpers.ts';

const decompose = (operand: number): DivisionOperandDecomposition => {
    const digits = String(operand).split('').map(Number);
    const parts = digits.map((digit, index): DivisionPlaceValuePart => {
        const placeValue = (10 ** (digits.length - index - 1)) as DivisionPlaceValuePart['placeValue'];
        return {digit, placeValue, value: digit * placeValue};
    });
    return {operand, parts};
};

const buildSteps = (
    dividend: number,
    divisor: number,
    quotient: number
): DivisionPartialQuotientStep[] => {
    const digits = String(quotient).split('').map(Number);
    let remaining = dividend;
    return digits.map((quotientDigit, index) => {
        const placeValue = (10 ** (digits.length - index - 1)) as DivisionPartialQuotientStep['placeValue'];
        const partialQuotient = quotientDigit * placeValue;
        const partialProduct = divisor * partialQuotient;
        const remainingBefore = remaining;
        const remainingAfter = remainingBefore - partialProduct;
        remaining = remainingAfter;
        return {
            quotientDigit,
            placeValue,
            partialQuotient,
            remainingBefore,
            partialProduct,
            remainingAfter
        };
    });
};

const problemFor = (dividend: number, divisor: number): MultiDigitDivisionProblem => {
    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    const partialQuotients = buildSteps(dividend, divisor, quotient);
    return {
        task: 'multi-digit-division',
        dividend,
        divisor,
        quotient,
        remainder,
        dividendDigits: String(dividend).length as 1 | 2 | 3 | 4,
        divisorDigits: 1,
        dividendDecomposition: decompose(dividend),
        divisorDecomposition: decompose(divisor),
        partialQuotients
    };
};

describe('operations-division-area-model validation', () => {
    it.each([
        [7, 3, 1],
        [97, 8, 2],
        [987, 8, 3],
        [9999, 2, 4]
    ])('accepts the authored %i ÷ %i profile with %i partial quotients', (dividend, divisor, steps) => {
        const problem = problemFor(dividend, divisor);
        expect(problem.partialQuotients).toHaveLength(steps);
        expect(isValidMultiDigitDivisionProblem(problem)).toBe(true);
    });

    it('accepts the four-digit physical maximum with complete chained evidence', () => {
        const problem = problemFor(9999, 2);
        expect(problem.quotient).toBe(4999);
        expect(problem.remainder).toBe(1);
        expect(problem.partialQuotients.at(-1)?.remainingAfter).toBe(1);
        expect(isValidMultiDigitDivisionProblem(problem)).toBe(true);
    });

    it('derives the complete division presentation from the numeric witness', () => {
        const presentation = multiDigitDivisionPresentation(problemFor(987, 8));
        expect(presentation).toMatchObject({
            prompt: 'Divide 987 by 8 using place-value partial quotients.',
            questionEquation: '987 ÷ 8 = ? R ?',
            solutionEquation: '987 ÷ 8 = 123 R 3',
            partialQuotientsSumEquation: '100 + 20 + 3 = 123',
            multiplicationCheckEquation: '8 × 123 + 3 = 987',
            remainderStatement: 'The remainder 3 is positive and less than the divisor 8.'
        });
        expect(presentation.dividendDecomposition.equation).toBe('987 = 900 + 80 + 7');
        expect(presentation.partialQuotients[0]).toMatchObject({
            placeName: 'hundreds',
            questionMultiplicationEquation: '8 × ? = ?',
            solutionMultiplicationEquation: '8 × 100 = 800',
            questionSubtractionEquation: '? − ? = ?',
            solutionSubtractionEquation: '987 − 800 = 187'
        });
    });

    it.each([
        ['zero dividend digit', () => problemFor(909, 2)],
        ['zero quotient digit', () => problemFor(811, 8)],
        ['exact division', () => problemFor(99, 9)],
        ['missing quotient step', () => {
            const problem = problemFor(987, 8);
            return {...problem, partialQuotients: problem.partialQuotients.slice(1)};
        }],
        ['wrong quotient-step order', () => {
            const problem = problemFor(987, 8);
            return {...problem, partialQuotients: [...problem.partialQuotients].reverse()};
        }],
        ['broken running-remainder chain', () => {
            const problem = problemFor(987, 8);
            const partialQuotients = [...problem.partialQuotients];
            partialQuotients[1] = {...partialQuotients[1]!, remainingBefore: 1};
            return {...problem, partialQuotients};
        }],
        ['wrong partial product', () => {
            const problem = problemFor(987, 8);
            const partialQuotients = [...problem.partialQuotients];
            partialQuotients[0] = {...partialQuotients[0]!, partialProduct: 799};
            return {...problem, partialQuotients};
        }]
    ])('rejects %s', (_description, build) => {
        expect(isValidMultiDigitDivisionProblem(
            build() as MultiDigitDivisionProblem
        )).toBe(false);
    });
});
