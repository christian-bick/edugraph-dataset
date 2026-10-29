import {describe, expect, it} from 'vitest';
import type {StandardAlgorithmColumnStep, StandardAlgorithmProblem} from '../../../types/problems.ts';
import {isValidStandardAlgorithmProblem} from '../../../visuals/views/operations/operations-standard-algorithm/helpers.ts';
import {isZeroFreeStandardAlgorithm} from './zero-arithmetic.ts';

type ColumnValues = readonly [number, number, 0 | 1, 0 | 1, number, number];
const problem = (operation: 'addition' | 'subtraction', topValue: number, bottomValue: number,
    result: number, columns: readonly ColumnValues[]): StandardAlgorithmProblem => ({
    task: 'standard-algorithm', operation, topValue, bottomValue, result,
    columns: columns.map(([topDigit, bottomDigit, regroupIn, regroupOut, workingValue, resultDigit], index) => ({
        placeValue: 10 ** index as StandardAlgorithmColumnStep['placeValue'],
        topDigit, bottomDigit, regroupIn, regroupOut, workingValue, resultDigit
    }))
});

const addition310 = problem('addition', 125, 185, 310, [
    [5, 5, 0, 1, 10, 0], [2, 8, 1, 1, 11, 1], [1, 1, 1, 0, 3, 3]
]);

describe('numerical zero in standard addition/subtraction', () => {
    it.each([
        ['addition writes a zero digit for the positive sum 5 + 5 = 10', addition310, true],
        ['addition uses a numerical zero top operand', problem('addition', 105, 125, 230, [
            [5, 5, 0, 1, 10, 0], [0, 2, 1, 0, 3, 3], [1, 1, 0, 0, 2, 2]
        ]), false],
        ['addition uses a numerical zero bottom operand', problem('addition', 125, 105, 230, [
            [5, 5, 0, 1, 10, 0], [2, 0, 1, 0, 3, 3], [1, 1, 0, 0, 2, 2]
        ]), false],
        ['addition calculates the numerical sum zero', problem('addition', 101, 101, 202, [
            [1, 1, 0, 0, 2, 2], [0, 0, 0, 0, 0, 0], [1, 1, 0, 0, 2, 2]
        ]), false],
        ['subtraction has positive instructed values throughout', problem('subtraction', 361, 125, 236, [
            [1, 5, 0, 1, 11, 6], [6, 2, 1, 0, 5, 3], [3, 1, 0, 0, 3, 2]
        ]), true],
        ['subtraction explicitly calculates 1 - 1 before borrowing again', problem('subtraction', 815, 349, 466, [
            [5, 9, 0, 1, 15, 6], [1, 4, 1, 1, 10, 6], [8, 3, 1, 0, 7, 4]
        ]), false],
        ['subtraction calculates a numerical result zero', problem('subtraction', 355, 125, 230, [
            [5, 5, 0, 0, 5, 0], [5, 2, 0, 0, 5, 3], [3, 1, 0, 0, 3, 2]
        ]), false]
    ] as const)('%s', (_description, data, expected) => {
        expect(isValidStandardAlgorithmProblem(data)).toBe(true);
        expect(isZeroFreeStandardAlgorithm(data)).toBe(expected);
    });

    it('ignores zero-valued bookkeeping flags omitted from the numerical calculation', () => {
        expect(addition310.columns[0]!.regroupIn).toBe(0);
        expect(addition310.columns.at(-1)!.regroupOut).toBe(0);
        expect(isZeroFreeStandardAlgorithm(addition310)).toBe(true);
    });

    it.each(['topValue', 'bottomValue', 'result'] as const)('requires a positive whole %s', field => {
        for (const value of [0, -1]) {
            expect(isZeroFreeStandardAlgorithm({...addition310, [field]: value})).toBe(false);
        }
    });
});
