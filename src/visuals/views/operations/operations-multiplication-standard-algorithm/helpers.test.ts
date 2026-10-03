import {describe, expect, it} from 'vitest';
import type {StandardMultiplicationProblem} from '../../../../types/problems.ts';
import {multiplicationCase} from './fixtures.ts';
import {formatMultiplicationNumeral, partialRowDigits, validStandardMultiplication, workColumnCount} from './helpers.ts';

const withRow = (
    data: StandardMultiplicationProblem,
    index: number,
    row: StandardMultiplicationProblem['partialRows'][number]
): StandardMultiplicationProblem => ({...data,
    partialRows: data.partialRows.map((candidate, candidateIndex) => candidateIndex === index ? row : candidate)});

describe('standard multiplication witness', () => {
    it('validates multiplication carries, aligned products and summation carries', () => {
        const data = multiplicationCase(347, 26);
        expect(validStandardMultiplication(data)).toBe(true);
        expect(data.partialRows.map(row => row.alignedProduct)).toEqual([2082, 6940]);
        expect(data.partialRows[0]!.columns.map(step => step.carryOut)).toEqual([4, 2, 2]);
        expect(data.partialRows[1]!.columns.map(step => step.carryOut)).toEqual([1, 0, 0]);
        expect(data.sumColumns.map(column => column.carryOut)).toEqual([0, 1, 1, 0]);
        expect(data.product).toBe(9022);
        expect(partialRowDigits(data, 0)).toEqual([null, 2, 0, 8, 2]);
        expect(partialRowDigits(data, 1)).toEqual([null, 6, 9, 4, 0]);
    });

    it('keeps a zero multiplier row and its place-shift zeros', () => {
        const data = multiplicationCase(347, 206);
        expect(validStandardMultiplication(data)).toBe(true);
        expect(data.partialRows.map(row => row.alignedProduct)).toEqual([2082, 0, 69400]);
        expect(data.partialRows[1]!.multiplierDigit).toBe(0);
        expect(partialRowDigits(data, 1)).toEqual([null, null, null, null, 0, 0]);
        expect(workColumnCount(data)).toBe(6);
    });

    it('accepts the four-by-three digit boundary with a leading carry', () => {
        const data = multiplicationCase(9999, 999);
        expect(validStandardMultiplication(data)).toBe(true);
        expect(data.product).toBe(9989001);
        expect(data.partialRows).toHaveLength(3);
        expect(data.partialRows[0]!.leadingCarry).toBe(8);
        expect(workColumnCount(data)).toBe(7);
        expect(formatMultiplicationNumeral(data.product)).toBe('9,989,001');
    });

    it('rejects wrong shifts, multiplication carries, missing zero rows, and sum columns', () => {
        const data = multiplicationCase(347, 206);
        expect(validStandardMultiplication(withRow(data, 1, {...data.partialRows[1]!, shiftPlaces: 0}))).toBe(false);
        const columns = [...data.partialRows[0]!.columns];
        columns[1] = {...columns[1]!, carryIn: 0};
        expect(validStandardMultiplication(withRow(data, 0, {...data.partialRows[0]!, columns}))).toBe(false);
        expect(validStandardMultiplication({...data, partialRows: [data.partialRows[0]!, data.partialRows[2]!]})).toBe(false);
        const sumColumns = [...data.sumColumns];
        sumColumns[2] = {...sumColumns[2]!, addendDigits: [9, 9, 9]};
        expect(validStandardMultiplication({...data, sumColumns})).toBe(false);
        expect(validStandardMultiplication({...data, product: 71483})).toBe(false);
    });
});
