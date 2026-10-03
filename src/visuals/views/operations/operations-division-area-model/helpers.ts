import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {
    DivisionOperandDecomposition,
    DivisionPartialQuotientStep,
    DivisionPlaceValuePart,
    MultiDigitDivisionProblem
} from '../../../../types/problems.ts';

const PLACE_NAMES = new Map<
    DivisionPlaceValuePart['placeValue'],
    string
>([
    [1, 'ones'],
    [10, 'tens'],
    [100, 'hundreds'],
    [1000, 'thousands']
]);

const samePart = (
    actual: DivisionPlaceValuePart | undefined,
    expected: DivisionPlaceValuePart
): boolean => actual !== undefined
    && actual.digit === expected.digit
    && actual.placeValue === expected.placeValue
    && actual.value === expected.value;

const expectedParts = (operand: number): DivisionPlaceValuePart[] =>
    String(operand).split('').map((character, index, digits) => {
        const digit = Number(character);
        const placeValue = (10 ** (digits.length - index - 1)) as DivisionPlaceValuePart['placeValue'];
        return {
            digit,
            placeValue,
            value: digit * placeValue
        };
    });

const isValidDecomposition = (
    decomposition: DivisionOperandDecomposition,
    operand: number
): boolean => {
    if (decomposition.operand !== operand || !Array.isArray(decomposition.parts)) return false;
    const parts = expectedParts(operand);
    if (decomposition.parts.length !== parts.length) return false;
    if (!decomposition.parts.every((part, index) => samePart(part, parts[index]!))) return false;

    return true;
};

const expectedQuotientParts = (quotient: number): DivisionPlaceValuePart[] =>
    expectedParts(quotient);

export type DivisionDisplayDecomposition = DivisionOperandDecomposition & {
    equation: string;
};

export type DivisionDisplayStep = DivisionPartialQuotientStep & {
    placeName: string;
    questionMultiplicationEquation: string;
    solutionMultiplicationEquation: string;
    questionSubtractionEquation: string;
    solutionSubtractionEquation: string;
};

export type MultiDigitDivisionPresentation = {
    dividendDecomposition: DivisionDisplayDecomposition;
    divisorDecomposition: DivisionDisplayDecomposition;
    partialQuotients: readonly DivisionDisplayStep[];
    prompt: string;
    questionEquation: string;
    solutionEquation: string;
    partialQuotientsSumEquation: string;
    multiplicationCheckEquation: string;
    remainderStatement: string;
    explanation: string;
};

const decompositionPresentation = (
    decomposition: DivisionOperandDecomposition
): DivisionDisplayDecomposition => {
    const expandedExpression = decomposition.parts
        .map(part => formatStandardNumeral(part.value))
        .join(' + ');
    return {
        ...decomposition,
        equation: `${formatStandardNumeral(decomposition.operand)} = ${expandedExpression}`
    };
};

export const multiDigitDivisionPresentation = (
    data: MultiDigitDivisionProblem
): MultiDigitDivisionPresentation => {
    const divisorText = formatStandardNumeral(data.divisor);
    const partialQuotients = data.partialQuotients.map(step => ({
        ...step,
        placeName: PLACE_NAMES.get(step.placeValue)!,
        questionMultiplicationEquation: `${divisorText} × ? = ?`,
        solutionMultiplicationEquation: `${divisorText} × ${formatStandardNumeral(step.partialQuotient)} = ${formatStandardNumeral(step.partialProduct)}`,
        questionSubtractionEquation: '? − ? = ?',
        solutionSubtractionEquation: `${formatStandardNumeral(step.remainingBefore)} − ${formatStandardNumeral(step.partialProduct)} = ${formatStandardNumeral(step.remainingAfter)}`
    }));
    const dividendText = formatStandardNumeral(data.dividend);
    const quotientText = formatStandardNumeral(data.quotient);
    const remainderText = formatStandardNumeral(data.remainder);
    const quotientExpression = partialQuotients
        .map(step => formatStandardNumeral(step.partialQuotient))
        .join(' + ');
    const exact = data.remainder === 0;
    const solutionEquation = exact
        ? `${dividendText} ÷ ${divisorText} = ${quotientText} (remainder 0)`
        : `${dividendText} ÷ ${divisorText} = ${quotientText} R ${remainderText}`;
    const multiplicationCheckEquation = exact
        ? `${divisorText} × ${quotientText} = ${dividendText}`
        : `${divisorText} × ${quotientText} + ${remainderText} = ${dividendText}`;
    const removedProducts = partialQuotients
        .map(step => formatStandardNumeral(step.partialProduct))
        .join(' + ');
    const remainderStatement = exact
        ? `Nothing remains, so ${dividendText} is exactly divisible by ${divisorText}.`
        : `The remainder ${remainderText} is positive and less than the divisor ${divisorText}.`;
    const legacyPresentation = data.divisorDigits === 1 && !exact;
    const explanation = legacyPresentation
        ? `Each partial quotient is multiplied by ${divisorText} and subtracted from the running remainder. The partial quotients ${quotientExpression} add to ${quotientText}, and the final subtraction leaves ${remainderText}. Check: ${multiplicationCheckEquation}. Therefore, ${solutionEquation}.`
        : `The quotient chunks ${quotientExpression} add to ${quotientText}. Multiplying each chunk by ${divisorText} removes ${removedProducts} from ${dividendText} in order, leaving ${remainderText}. ${remainderStatement} Check: ${multiplicationCheckEquation}.`;
    return {
        dividendDecomposition: decompositionPresentation(data.dividendDecomposition),
        divisorDecomposition: decompositionPresentation(data.divisorDecomposition),
        partialQuotients,
        prompt: `Divide ${dividendText} by ${divisorText} using place-value partial quotients.`,
        questionEquation: `${dividendText} ÷ ${divisorText} = ? R ?`,
        solutionEquation,
        partialQuotientsSumEquation: `${quotientExpression} = ${quotientText}`,
        multiplicationCheckEquation,
        remainderStatement,
        explanation
    };
};

export const isValidMultiDigitDivisionProblem = (
    data: MultiDigitDivisionProblem
): boolean => {
    if (data.task !== 'multi-digit-division') return false;
    if (!Number.isSafeInteger(data.dividend)
        || !Number.isSafeInteger(data.divisor)
        || data.dividend < 2
        || data.dividend > 9999
        || data.divisor < 2
        || data.divisor > 99
        || data.dividend < data.divisor) return false;

    if (data.dividendDigits !== String(data.dividend).length
        || data.divisorDigits !== String(data.divisor).length
        || data.divisorDigits < 1
        || data.divisorDigits > 2
        || data.dividendDigits < 1
        || data.dividendDigits > 4
        || !Number.isSafeInteger(data.quotient)
        || data.quotient <= 0
        || !Number.isSafeInteger(data.remainder)
        || data.remainder < 0
        || data.remainder >= data.divisor
        || data.divisor * data.quotient + data.remainder !== data.dividend) return false;

    if (!isValidDecomposition(data.dividendDecomposition, data.dividend)
        || !isValidDecomposition(data.divisorDecomposition, data.divisor)
        || !Array.isArray(data.partialQuotients)) return false;

    const quotientParts = expectedQuotientParts(data.quotient);
    if (data.partialQuotients.length !== quotientParts.length) return false;

    let remaining = data.dividend;
    for (let index = 0; index < quotientParts.length; index++) {
        const expected = quotientParts[index]!;
        const step = data.partialQuotients[index]!;
        const partialProduct = data.divisor * expected.value;
        const remainingAfter = remaining - partialProduct;
        if (step === undefined
            || step.quotientDigit !== expected.digit
            || step.placeValue !== expected.placeValue
            || step.partialQuotient !== expected.value
            || step.remainingBefore !== remaining
            || step.partialProduct !== partialProduct
            || step.remainingAfter !== remainingAfter
            || step.remainingAfter < 0) return false;
        remaining = remainingAfter;
    }
    if (remaining !== data.remainder
        || data.partialQuotients.reduce((sum, step) => sum + step.partialQuotient, 0)
            !== data.quotient) return false;

    return true;
};
