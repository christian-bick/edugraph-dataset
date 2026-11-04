import {describe, expect, it} from 'vitest';
import {createCanonicalNumericRange} from '../../../lib/canonical-numeric-range.ts';
import {getRandomState, random, setSeed} from '../../../lib/random.ts';
import type {StandardMultiplicationProblem} from '../../../types/problems.ts';
import {
    buildStandardMultiplicationProblem,
    StandardAlgorithmMultiplicationGenerator
} from './generator.ts';
import {STANDARD_MULTIPLICATION_UPPERS, type StandardMultiplicationRange} from './domain.ts';

const generator = new StandardAlgorithmMultiplicationGenerator();
const profiles: {name: string; range: StandardMultiplicationRange}[] = [
    ...STANDARD_MULTIPLICATION_UPPERS.map(upper => ({name: `upper ${upper}`, range: createCanonicalNumericRange(upper)})),
    {name: 'overflow', range: false}
];

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
        setSeed('invalid-multiplication');
        const state = getRandomState();
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({})).toThrow('range');
        for (const range of [undefined, null, true, {}, createCanonicalNumericRange(120), createCanonicalNumericRange(1000, 5),
            {...createCanonicalNumericRange(1000), maximumAbove: 0}, {...createCanonicalNumericRange(1000), minimumBelow: 10}])
            expect(() => generator.generate({range} as never)).toThrow();
        expect(getRandomState()).toBe(state);
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

    it.each(profiles)('samples exact canonical mathematics in $name', ({range}) => {
        for (let seed = 0; seed < 60; seed++) {
            setSeed(seed);
            const data = generator.generate({range}).data;
            expectExactAlgorithm(data);
            if (range === false) expect(data.product).toBeGreaterThan(1000000);
            else {
                expect(data.product).toBeGreaterThan(range.maximumAbove);
                expect(data.product).toBeLessThanOrEqual(range.max);
            }
            expect(data.partialRows.some(row => row.columns.some(column => column.carryOut > 0))).toBe(true);
            expect(data.sumColumns.some(column => column.carryOut > 0)).toBe(true);
        }
    });

    it('retains every factor width and native zero-digit passes across the five profiles', () => {
        const multiplicandWidths = new Set<number>();
        const multiplierWidths = new Set<number>();
        let zeroPasses = 0;
        for (let seed = 0; seed < 300; seed++) {
            setSeed(seed);
            const data = generator.generate({range: profiles[seed % profiles.length]!.range}).data;
            multiplicandWidths.add(String(data.multiplicand).length);
            multiplierWidths.add(String(data.multiplier).length);
            if (data.partialRows.some(row => row.multiplierDigit === 0)) zeroPasses++;
        }
        expect(multiplicandWidths).toEqual(new Set([2, 3, 4]));
        expect(multiplierWidths).toEqual(new Set([2, 3]));
        expect(zeroPasses).toBeGreaterThan(0);
    });

    it.each(profiles)('replays fresh exact payloads and consumes two draws in $name', ({range}) => {
        setSeed('standard-algorithm-multiplication');
        random();
        random();
        const continuation = getRandomState();
        setSeed('standard-algorithm-multiplication');
        const first = generator.generate({range});
        expect(getRandomState()).toBe(continuation);
        setSeed('standard-algorithm-multiplication');
        const second = generator.generate({range});
        expect(second).toEqual(first);
        expect(second.data).not.toBe(first.data);
        expect(second.data.partialRows).not.toBe(first.data.partialRows);
        expect(second.data.partialRows[0]!.columns).not.toBe(first.data.partialRows[0]!.columns);
        expect(second.data.sumColumns).not.toBe(first.data.sumColumns);
    });
});
