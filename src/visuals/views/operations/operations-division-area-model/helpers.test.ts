import {describe, expect, it} from 'vitest';
import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {
    DivisionOperandDecomposition,
    DivisionPartialQuotientStep,
    DivisionPlaceValuePart,
    MultiDigitDivisionProblem
} from '../../../../types/problems.ts';
import {isValidMultiDigitDivisionProblem} from './helpers.ts';

const placeNames = new Map<DivisionPlaceValuePart['placeValue'],
    DivisionPlaceValuePart['placeName']>([
        [1, 'ones'],
        [10, 'tens'],
        [100, 'hundreds'],
        [1000, 'thousands']
    ]);

const decompose = (operand: number): DivisionOperandDecomposition => {
    const digits = String(operand).split('').map(Number);
    const parts = digits.map((digit, index): DivisionPlaceValuePart => {
        const placeValue = (10 ** (digits.length - index - 1)) as DivisionPlaceValuePart['placeValue'];
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
            placeName: placeNames.get(placeValue)!,
            partialQuotient,
            remainingBefore,
            partialProduct,
            remainingAfter,
            questionMultiplicationEquation: `${formatStandardNumeral(divisor)} × ? = ?`,
            solutionMultiplicationEquation: `${formatStandardNumeral(divisor)} × ${formatStandardNumeral(partialQuotient)} = ${formatStandardNumeral(partialProduct)}`,
            questionSubtractionEquation: '? − ? = ?',
            solutionSubtractionEquation: `${formatStandardNumeral(remainingBefore)} − ${formatStandardNumeral(partialProduct)} = ${formatStandardNumeral(remainingAfter)}`
        };
    });
};

const problemFor = (dividend: number, divisor: number): MultiDigitDivisionProblem => {
    const quotient = Math.floor(dividend / divisor);
    const remainder = dividend % divisor;
    const partialQuotients = buildSteps(dividend, divisor, quotient);
    const dividendText = formatStandardNumeral(dividend);
    const divisorText = formatStandardNumeral(divisor);
    const quotientText = formatStandardNumeral(quotient);
    const remainderText = formatStandardNumeral(remainder);
    const quotientExpression = partialQuotients
        .map(step => formatStandardNumeral(step.partialQuotient))
        .join(' + ');
    const solutionEquation = `${dividendText} ÷ ${divisorText} = ${quotientText} R ${remainderText}`;
    const multiplicationCheckEquation = `${divisorText} × ${quotientText} + ${remainderText} = ${dividendText}`;
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
        partialQuotients,
        prompt: `Divide ${dividendText} by ${divisorText} using place-value partial quotients.`,
        questionEquation: `${dividendText} ÷ ${divisorText} = ? R ?`,
        solutionEquation,
        partialQuotientsSumEquation: `${quotientExpression} = ${quotientText}`,
        multiplicationCheckEquation,
        remainderStatement: `The remainder ${remainderText} is positive and less than the divisor ${divisorText}.`,
        explanation: `Each partial quotient is multiplied by ${divisorText} and subtracted from the running remainder. The partial quotients ${quotientExpression} add to ${quotientText}, and the final subtraction leaves ${remainderText}. Check: ${multiplicationCheckEquation}. Therefore, ${solutionEquation}.`
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
        ['leaking multiplication question', () => {
            const problem = problemFor(987, 8);
            const partialQuotients = [...problem.partialQuotients];
            partialQuotients[0] = {
                ...partialQuotients[0]!,
                questionMultiplicationEquation: partialQuotients[0]!.solutionMultiplicationEquation
            };
            return {...problem, partialQuotients};
        }],
        ['leaking subtraction question', () => {
            const problem = problemFor(987, 8);
            const partialQuotients = [...problem.partialQuotients];
            partialQuotients[0] = {
                ...partialQuotients[0]!,
                questionSubtractionEquation: partialQuotients[0]!.solutionSubtractionEquation
            };
            return {...problem, partialQuotients};
        }],
        ['wrong multiplication check', () => ({
            ...problemFor(987, 8),
            multiplicationCheckEquation: '8 × 123 + 2 = 986'
        })],
        ['wrong explanation', () => ({...problemFor(987, 8), explanation: 'Use division.'})]
    ])('rejects %s', (_description, build) => {
        expect(isValidMultiDigitDivisionProblem(
            build() as MultiDigitDivisionProblem
        )).toBe(false);
    });
});
