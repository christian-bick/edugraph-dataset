import type {DecimalStandardAddSubtractProblem, ExactDecimalValue} from '../../../types/problems.ts';

const integerWidth = (value: ExactDecimalValue) => value.numeral.split('.')[0]!.length;

/** Count active zero quantities and exhausted borrows, excluding zero digits from positive sums and hidden sentinels. */
export const hasDecimalColumnZero = (data: DecimalStandardAddSubtractProblem): boolean => {
    const topWidth = integerWidth(data.top), bottomWidth = integerWidth(data.bottom);
    return [data.top, data.bottom, data.result].some(value => value.coefficient === 0)
        || data.columns.some(column => {
            const topActive = column.placeExponent < topWidth;
            const bottomActive = column.placeExponent < bottomWidth;
            return topActive && column.topDigit === 0
                || bottomActive && column.bottomDigit === 0
                || (topActive || bottomActive) && (column.workingValue === 0
                    || data.operation === 'subtraction' && column.resultDigit === 0)
                || data.operation === 'subtraction' && topActive
                    && column.topDigit - column.regroupIn === 0;
        });
};
