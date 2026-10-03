import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {StandardMultiplicationProblem} from '../../../types/problems.ts';
import {
    buildStandardMultiplicationProblem,
    StandardAlgorithmMultiplicationGenerator
} from './generator.ts';

const generator = new StandardAlgorithmMultiplicationGenerator();

const digitAt = (value: number, placeIndex: number): number =>
    Math.floor(value / 10 ** placeIndex) % 10;

function expectExactAlgorithm(data: StandardMultiplicationProblem): void {
    expect(data.kind).toBe('whole-number-standard-multiplication');
    expect(Number.isSafeInteger(data.multiplicand)).toBe(true);
    expect(Number.isSafeInteger(data.multiplier)).toBe(true);
    expect(Number.isSafeInteger(data.product)).toBe(true);
    expect(data.multiplicand).toBeGreaterThanOrEqual(10);
    expect(data.multiplicand).toBeLessThanOrEqual(9999);
    expect(data.multiplier).toBeGreaterThanOrEqual(10);
    expect(data.multiplier).toBeLessThanOrEqual(999);
    expect(data.product).toBe(data.multiplicand * data.multiplier);
    expect(data.product).toBeLessThanOrEqual(9_989_001);

    const multiplicandDigits = String(data.multiplicand).length;
    expect(data.partialRows).toHaveLength(String(data.multiplier).length);
    data.partialRows.forEach((row, shiftPlaces) => {
        expect(row.shiftPlaces).toBe(shiftPlaces);
        expect(row.multiplierDigit).toBe(digitAt(data.multiplier, shiftPlaces));
        expect(row.columns).toHaveLength(multiplicandDigits);
        let carry = 0;
        let reconstructed = 0;
        row.columns.forEach((column, placeIndex) => {
            const multiplicandDigit = digitAt(data.multiplicand, placeIndex);
            const workingValue = multiplicandDigit * row.multiplierDigit + carry;
            expect(column).toEqual({
                placeIndex,
                multiplicandDigit,
                carryIn: carry,
                workingValue,
                resultDigit: workingValue % 10,
                carryOut: Math.floor(workingValue / 10)
            });
            expect(column.carryOut).toBeLessThanOrEqual(8);
            reconstructed += column.resultDigit * 10 ** placeIndex;
            carry = column.carryOut;
        });
        reconstructed += carry * 10 ** multiplicandDigits;
        expect(row.leadingCarry).toBe(carry);
        expect(row.unshiftedProduct).toBe(reconstructed);
        expect(row.unshiftedProduct).toBe(data.multiplicand * row.multiplierDigit);
        expect(row.alignedProduct).toBe(row.unshiftedProduct * 10 ** shiftPlaces);
        if (row.multiplierDigit === 0) {
            expect(row.leadingCarry).toBe(0);
            expect(row.unshiftedProduct).toBe(0);
            expect(row.columns.every(column => column.workingValue === 0)).toBe(true);
        }
    });

    expect(data.partialRows.reduce((sum, row) => sum + row.alignedProduct, 0)).toBe(data.product);
    expect(data.sumColumns).toHaveLength(String(data.product).length);
    let sumCarry = 0;
    let reconstructedProduct = 0;
    data.sumColumns.forEach((column, placeIndex) => {
        const addendDigits = data.partialRows.map(row => digitAt(row.alignedProduct, placeIndex));
        const workingValue = addendDigits.reduce((sum, digit) => sum + digit, sumCarry);
        expect(column).toEqual({
            placeIndex,
            addendDigits,
            carryIn: sumCarry,
            workingValue,
            resultDigit: workingValue % 10,
            carryOut: Math.floor(workingValue / 10)
        });
        expect(column.carryOut).toBeLessThanOrEqual(2);
        reconstructedProduct += column.resultDigit * 10 ** placeIndex;
        sumCarry = column.carryOut;
    });
    expect(sumCarry).toBe(0);
    expect(reconstructedProduct).toBe(data.product);
}

describe('StandardAlgorithmMultiplicationGenerator', () => {
    it('validates configuration and explicit factor bounds', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => buildStandardMultiplicationProblem(9, 10)).toThrow(RangeError);
        expect(() => buildStandardMultiplicationProblem(10, 1000)).toThrow(RangeError);
    });

    it('preserves a zero multiplier-digit row and both multiplication and summation carries', () => {
        const data = buildStandardMultiplicationProblem(987, 909);
        expectExactAlgorithm(data);
        expect(data.partialRows.map(row => row.unshiftedProduct)).toEqual([8883, 0, 8883]);
        expect(data.partialRows.map(row => row.alignedProduct)).toEqual([8883, 0, 888300]);
        expect(data.partialRows[0]!.columns.map(column => column.carryOut)).toEqual([6, 7, 8]);
        expect(data.sumColumns.some(column => column.carryOut > 0)).toBe(true);
        expect(data.product).toBe(897_183);
    });

    it.each([
        [10, 10, 100],
        [999, 99, 98_901],
        [9999, 999, 9_989_001]
    ])('builds exact boundary case %i × %i', (multiplicand, multiplier, product) => {
        const data = buildStandardMultiplicationProblem(multiplicand, multiplier);
        expectExactAlgorithm(data);
        expect(data.product).toBe(product);
    });

    it('samples both factor widths, zero passes, and visible carries', () => {
        const multiplicandWidths = new Set<number>();
        const multiplierWidths = new Set<number>();
        let zeroPasses = 0;
        for (let seed = 0; seed < 300; seed++) {
            setSeed(seed);
            const data = generator.generate({})?.data;
            expect(data).toBeDefined();
            expectExactAlgorithm(data!);
            multiplicandWidths.add(String(data!.multiplicand).length);
            multiplierWidths.add(String(data!.multiplier).length);
            if (data!.partialRows.some(row => row.multiplierDigit === 0)) zeroPasses++;
            expect(data!.partialRows.some(row => row.columns.some(column => column.carryOut > 0)))
                .toBe(true);
            expect(data!.sumColumns.some(column => column.carryOut > 0)).toBe(true);
        }
        expect(multiplicandWidths).toEqual(new Set([2, 3, 4]));
        expect(multiplierWidths).toEqual(new Set([2, 3]));
        expect(zeroPasses).toBeGreaterThan(0);
    });

    it('replays the same factor and carry chains under the same seed', () => {
        setSeed('standard-algorithm-multiplication');
        const first = generator.generate({});
        setSeed('standard-algorithm-multiplication');
        expect(generator.generate({})).toEqual(first);
    });
});
