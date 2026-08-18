import {
    DecimalComparisonOperand,
    DecimalComparisonProblem,
    DecimalFractionValue
} from '../../../../types/problems.ts';
import {isValidTenthsHundredthsGrid} from '../../../helpers/tenths-hundredths-grid.ts';

const PROMPT = 'Compare the decimals. Use >, =, or <.';

const relationPhrase = (
    relation: DecimalComparisonProblem['relation']
): string => relation === 'greater'
    ? 'greater than'
    : relation === 'less'
        ? 'less than'
        : 'equal to';

const normalizedNotation = (hundredths: number): string =>
    `0.${String(hundredths).padStart(2, '0')}`;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null;

const validOperand = (
    operand: DecimalComparisonOperand,
    role: DecimalComparisonOperand['role']
): boolean => {
    if (!isRecord(operand)
        || operand.role !== role
        || (operand.precision !== 'tenths' && operand.precision !== 'hundredths')
        || operand.wholeDigit !== 0
        || !Number.isInteger(operand.normalizedHundredths)
        || operand.normalizedHundredths < 1
        || operand.normalizedHundredths > 99
        || !Number.isInteger(operand.tenthsDigit)
        || operand.tenthsDigit !== Math.floor(operand.normalizedHundredths / 10)
        || operand.normalizedHundredthsNotation !== normalizedNotation(operand.normalizedHundredths)
        || !isRecord(operand.placeValueRow)
        || operand.placeValueRow.ones !== '0'
        || operand.placeValueRow.tenths !== String(operand.tenthsDigit)
        || operand.placeValueRow.hundredths !== String(operand.normalizedHundredths % 10)) return false;

    const isTenths = operand.precision === 'tenths';
    const expectedDecimal = isTenths
        ? `0.${operand.tenthsDigit}`
        : operand.normalizedHundredthsNotation;
    if (operand.decimalNotation !== expectedDecimal
        || (isTenths
            ? operand.hundredthsDigit !== null || operand.normalizedHundredths % 10 !== 0
            : operand.hundredthsDigit !== operand.normalizedHundredths % 10)) return false;

    const modelValue: DecimalFractionValue = {
        numerator: operand.normalizedHundredths,
        denominator: 100,
        notation: `${operand.normalizedHundredths}/100`
    };
    return isValidTenthsHundredthsGrid(operand.model, modelValue);
};

const expectedExplanation = (
    data: DecimalComparisonProblem,
    phrase: string
): string => {
    if (data.firstDecidingPlace === 'equal') {
        return `Both models shade ${data.left.normalizedHundredths} of 100 equal parts of the same whole. Therefore, ${data.solutionEquation}.`;
    }
    if (data.firstDecidingPlace === 'tenths') {
        return `Both decimals refer to the same whole. At the tenths place, ${data.left.tenthsDigit} is ${phrase} ${data.right.tenthsDigit}. Therefore, ${data.solutionEquation}.`;
    }
    return `Both decimals refer to the same whole. Their tenths digits are both ${data.left.tenthsDigit}. At the hundredths place, ${data.left.normalizedHundredths % 10} is ${phrase} ${data.right.normalizedHundredths % 10}. Therefore, ${data.solutionEquation}.`;
};

export const isValidDecimalComparisonProblem = (
    data: DecimalComparisonProblem
): boolean => {
    if (!isRecord(data)
        || data.task !== 'compare-decimals'
        || data.sharedWhole !== 1
        || !['greater', 'equal', 'less'].includes(data.relation)
        || !validOperand(data.left, 'left')
        || !validOperand(data.right, 'right')
        || data.left.precision === data.right.precision) return false;

    const relation = data.left.normalizedHundredths > data.right.normalizedHundredths
        ? 'greater'
        : data.left.normalizedHundredths < data.right.normalizedHundredths
            ? 'less'
            : 'equal';
    const symbol = relation === 'greater' ? '>' : relation === 'less' ? '<' : '=';
    const decidingPlace = relation === 'equal'
        ? 'equal'
        : data.left.tenthsDigit === data.right.tenthsDigit
            ? 'hundredths'
            : 'tenths';
    const phrase = relationPhrase(relation);
    const hundredthsOperand = data.left.precision === 'hundredths' ? data.left : data.right;
    const questionEquation = `${data.left.decimalNotation} ? ${data.right.decimalNotation}`;
    const solutionEquation = `${data.left.decimalNotation} ${symbol} ${data.right.decimalNotation}`;

    return (relation === 'equal' || hundredthsOperand.normalizedHundredths % 10 !== 0)
        && data.relation === relation
        && data.symbol === symbol
        && data.firstDecidingPlace === decidingPlace
        && data.prompt === PROMPT
        && data.questionEquation === questionEquation
        && data.solutionEquation === solutionEquation
        && data.answer === symbol
        && data.answerStatement === `${data.left.decimalNotation} is ${phrase} ${data.right.decimalNotation}, so ${solutionEquation}.`
        && data.explanation === expectedExplanation(data, phrase);
};
