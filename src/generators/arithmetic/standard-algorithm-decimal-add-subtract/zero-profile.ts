import type {DecimalStandardAddSubtractProblem, ExactDecimalValue} from '../../../types/problems.ts';

const integerWidth = (value: ExactDecimalValue) => value.numeral.split('.')[0]!.length;

/** Active column quantities, including depletion before a chained borrow; hidden carry sentinels are excluded. */
export const hasDecimalColumnZero = (data: DecimalStandardAddSubtractProblem): boolean =>
    [data.top, data.bottom, data.result].some(value => value.coefficient === 0)
    || data.columns.some(column =>
        column.placeExponent < integerWidth(data.top) && column.topDigit === 0
        || column.placeExponent < integerWidth(data.bottom) && column.bottomDigit === 0
        || column.placeExponent < integerWidth(data.result) && column.resultDigit === 0
        || data.operation === 'subtraction' && column.placeExponent < integerWidth(data.top)
            && column.topDigit - column.regroupIn === 0);
