import {formatStandardNumeral} from '../../../../lib/whole-number-notation.ts';
import {
    StandardAlgorithmColumnStep,
    StandardAlgorithmPlaceName,
    StandardAlgorithmProblem
} from '../../../../types/problems.ts';

const PLACE_NAMES = new Map<number, StandardAlgorithmPlaceName>([
    [1, 'ones'],
    [10, 'tens'],
    [100, 'hundreds'],
    [1000, 'thousands'],
    [10000, 'ten-thousands'],
    [100000, 'hundred-thousands']
]);

const isDigit = (value: number): boolean => Number.isInteger(value) && value >= 0 && value <= 9;

const hasText = (value: unknown): value is string =>
    typeof value === 'string' && value.trim().length > 0;

const hasValidAuthoredText = (data: StandardAlgorithmProblem): boolean => {
    const symbol = data.operation === 'addition' ? '+' : '−';
    const top = formatStandardNumeral(data.topValue);
    const bottom = formatStandardNumeral(data.bottomValue);
    const result = formatStandardNumeral(data.result);

    return hasText(data.prompt)
        && data.questionEquation === `${top} ${symbol} ${bottom} = ?`
        && data.solutionEquation === `${top} ${symbol} ${bottom} = ${result}`
        && hasText(data.explanation)
        && data.columns.every(column =>
            hasText(column.calculation) && hasText(column.regroupingRecord)
        );
};

const digitAt = (value: number, placeValue: number): number =>
    Math.floor(value / placeValue) % 10;

const hasValidColumnIdentity = (
    column: StandardAlgorithmColumnStep,
    index: number,
    data: StandardAlgorithmProblem
): boolean => {
    const placeValue = 10 ** index;
    return column.placeValue === placeValue
        && column.placeName === PLACE_NAMES.get(placeValue)
        && isDigit(column.topDigit)
        && isDigit(column.bottomDigit)
        && isDigit(column.resultDigit)
        && column.topDigit === digitAt(data.topValue, placeValue)
        && column.bottomDigit === digitAt(data.bottomValue, placeValue)
        && column.resultDigit === digitAt(data.result, placeValue)
        && (column.regroupIn === 0 || column.regroupIn === 1)
        && (column.regroupOut === 0 || column.regroupOut === 1)
        && Number.isInteger(column.workingValue);
};

const hasValidAdditionStep = (
    column: StandardAlgorithmColumnStep,
    expectedRegroupIn: 0 | 1
): boolean => {
    const workingValue = column.topDigit + column.bottomDigit + expectedRegroupIn;
    const regroupOut = workingValue >= 10 ? 1 : 0;
    return column.regroupIn === expectedRegroupIn
        && column.workingValue === workingValue
        && column.regroupOut === regroupOut
        && column.resultDigit === workingValue % 10;
};

const hasValidSubtractionStep = (
    column: StandardAlgorithmColumnStep,
    expectedRegroupIn: 0 | 1
): boolean => {
    const availableTopDigit = column.topDigit - expectedRegroupIn;
    const regroupOut = availableTopDigit < column.bottomDigit ? 1 : 0;
    const workingValue = availableTopDigit + 10 * regroupOut;
    return column.regroupIn === expectedRegroupIn
        && column.workingValue === workingValue
        && column.regroupOut === regroupOut
        && column.resultDigit === workingValue - column.bottomDigit;
};

export const isValidStandardAlgorithmProblem = (
    data: StandardAlgorithmProblem
): boolean => {
    if (data.task !== 'standard-algorithm'
        || !['addition', 'subtraction'].includes(data.operation)
        || !Number.isSafeInteger(data.topValue)
        || !Number.isSafeInteger(data.bottomValue)
        || !Number.isSafeInteger(data.result)
        || data.topValue <= 0
        || data.bottomValue <= 0
        || data.result <= 0
        || !Array.isArray(data.columns)
        || data.columns.length < 3
        || data.columns.length > 6) return false;

    const expectedResult = data.operation === 'addition'
        ? data.topValue + data.bottomValue
        : data.topValue - data.bottomValue;
    const requiredColumns = Math.max(
        String(data.topValue).length,
        String(data.bottomValue).length,
        String(data.result).length
    );
    if (data.result !== expectedResult
        || data.columns.length !== requiredColumns
        || !hasValidAuthoredText(data)) return false;

    let expectedRegroupIn: 0 | 1 = 0;
    for (let index = 0; index < data.columns.length; index++) {
        const column = data.columns[index]!;
        if (!hasValidColumnIdentity(column, index, data)) return false;
        const validStep = data.operation === 'addition'
            ? hasValidAdditionStep(column, expectedRegroupIn)
            : hasValidSubtractionStep(column, expectedRegroupIn);
        if (!validStep) return false;
        expectedRegroupIn = column.regroupOut;
    }

    return expectedRegroupIn === 0;
};
