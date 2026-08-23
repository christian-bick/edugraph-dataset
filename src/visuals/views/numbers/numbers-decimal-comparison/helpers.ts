import {
    DecimalComparisonOperand,
    DecimalComparisonProblem,
    DecimalFractionValue
} from '../../../../types/problems.ts';
import {isValidTenthsHundredthsGrid} from '../../../helpers/tenths-hundredths-grid.ts';

const relationPhrase = (
    relation: DecimalComparisonProblem['relation']
): string => relation === 'greater'
    ? 'greater than'
    : relation === 'less'
        ? 'less than'
        : 'equal to';

export const normalizedDecimalNotation = (hundredths: number): string =>
    `0.${String(hundredths).padStart(2, '0')}`;

export const decimalComparisonNotation = (operand: DecimalComparisonOperand): string =>
    operand.precision === 'tenths'
        ? `0.${operand.tenthsDigit}`
        : normalizedDecimalNotation(operand.normalizedHundredths);

export const decimalPlaceValueRow = (operand: DecimalComparisonOperand) => ({
    ones: String(operand.wholeDigit),
    tenths: String(operand.tenthsDigit),
    hundredths: String(operand.normalizedHundredths % 10)
});

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const validOperand = (operand: DecimalComparisonOperand): boolean => {
    if (!isRecord(operand)
        || (operand.precision !== 'tenths' && operand.precision !== 'hundredths')
        || operand.wholeDigit !== 0
        || !Number.isInteger(operand.normalizedHundredths)
        || operand.normalizedHundredths < 1
        || operand.normalizedHundredths > 99
        || !Number.isInteger(operand.tenthsDigit)
        || operand.tenthsDigit !== Math.floor(operand.normalizedHundredths / 10)) return false;

    const isTenths = operand.precision === 'tenths';
    if (isTenths
        ? operand.hundredthsDigit !== null || operand.normalizedHundredths % 10 !== 0
        : operand.hundredthsDigit !== operand.normalizedHundredths % 10) return false;

    const modelValue: DecimalFractionValue = {
        numerator: operand.normalizedHundredths,
        denominator: 100
    };
    return isValidTenthsHundredthsGrid(operand.model, modelValue);
};

const expectedExplanation = (
    data: DecimalComparisonProblem,
    phrase: string,
    solutionEquation: string
): string => {
    if (data.firstDecidingPlace === 'equal') {
        return `Both models shade ${data.left.normalizedHundredths} of 100 equal parts of the same whole. Therefore, ${solutionEquation}.`;
    }
    if (data.firstDecidingPlace === 'tenths') {
        return `Both decimals refer to the same whole. At the tenths place, ${data.left.tenthsDigit} is ${phrase} ${data.right.tenthsDigit}. Therefore, ${solutionEquation}.`;
    }
    return `Both decimals refer to the same whole. Their tenths digits are both ${data.left.tenthsDigit}. At the hundredths place, ${data.left.normalizedHundredths % 10} is ${phrase} ${data.right.normalizedHundredths % 10}. Therefore, ${solutionEquation}.`;
};

export const decimalComparisonPresentation = (data: DecimalComparisonProblem) => {
    const phrase = relationPhrase(data.relation);
    const leftNotation = decimalComparisonNotation(data.left);
    const rightNotation = decimalComparisonNotation(data.right);
    const symbol = data.relation === 'greater' ? '>' : data.relation === 'less' ? '<' : '=';
    const questionEquation = `${leftNotation} ? ${rightNotation}`;
    const solutionEquation = `${leftNotation} ${symbol} ${rightNotation}`;
    return {
        prompt: 'Compare the decimals. Use >, =, or <.',
        questionEquation,
        solutionEquation,
        answerStatement: `${leftNotation} is ${phrase} ${rightNotation}, so ${solutionEquation}.`,
        explanation: expectedExplanation(data, phrase, solutionEquation)
    };
};

export const isValidDecimalComparisonProblem = (
    data: DecimalComparisonProblem
): boolean => {
    if (!isRecord(data)
        || data.task !== 'compare-decimals'
        || data.sharedWhole !== 1
        || !['greater', 'equal', 'less'].includes(data.relation)
        || !validOperand(data.left)
        || !validOperand(data.right)
        || data.left.precision === data.right.precision) return false;

    const relation = data.left.normalizedHundredths > data.right.normalizedHundredths
        ? 'greater'
        : data.left.normalizedHundredths < data.right.normalizedHundredths
            ? 'less'
            : 'equal';
    const decidingPlace = relation === 'equal'
        ? 'equal'
        : data.left.tenthsDigit === data.right.tenthsDigit
            ? 'hundredths'
            : 'tenths';
    const hundredthsOperand = data.left.precision === 'hundredths' ? data.left : data.right;

    return (relation === 'equal' || hundredthsOperand.normalizedHundredths % 10 !== 0)
        && data.relation === relation
        && data.firstDecidingPlace === decidingPlace;
};
