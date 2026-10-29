import type {StandardAlgorithmProblem} from '../../../types/problems.ts';

/**
 * Check the values used by the instructed column calculations, not numeral glyphs.
 * An addition result digit 0 can record a positive sum such as 5 + 5 = 10;
 * subtraction instead writes the actual column subtraction result.
 * Unused carry/borrow flags are bookkeeping, not numerical operands.
 */
export const isZeroFreeStandardAlgorithm = (data: StandardAlgorithmProblem): boolean =>
    [data.topValue, data.bottomValue, data.result].every(value => value > 0)
    && data.columns.every(column => column.workingValue !== 0
        && column.topDigit !== 0
        && column.bottomDigit !== 0
        && (data.operation === 'addition'
            || column.topDigit - column.regroupIn !== 0 && column.resultDigit !== 0));
