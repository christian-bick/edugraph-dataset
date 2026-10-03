import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {
    DecimalMultiplicationOperand,
    DecimalMultiplicationProblem
} from '../../../types/problems.ts';
import {
    createDecimalMultiplicationProblem,
    DecimalMultiplicationModelGenerator
} from './generator.ts';

const generator = new DecimalMultiplicationModelGenerator();

function expectOperand(operand: DecimalMultiplicationOperand): void {
    const value = operand.valueInHundredths;
    expect(operand.alignedDigits).toEqual([
        Math.floor(value / 100), Math.floor(value / 10) % 10, value % 10
    ]);
    const fraction = String(value % 100).padStart(2, '0').replace(/0+$/, '');
    expect(operand.canonicalNumeral).toBe(fraction === ''
        ? String(Math.floor(value / 100))
        : `${Math.floor(value / 100)}.${fraction}`);
    const places = ['ones', 'tenths', 'hundredths'];
    let nextStart = 0;
    for (const partition of operand.partitions) {
        expect(places.indexOf(partition.place)).toBeGreaterThanOrEqual(0);
        expect(partition.digit).toBeGreaterThan(0);
        expect(partition.digit).toBeLessThanOrEqual(9);
        expect(partition.digit).toBe(operand.alignedDigits[places.indexOf(partition.place)]);
        expect(partition.valueInHundredths)
            .toBe(partition.digit * ({ones: 100, tenths: 10, hundredths: 1})[partition.place]);
        expect(partition.startInHundredths).toBe(nextStart);
        nextStart += partition.valueInHundredths;
    }
    expect(operand.partitions.map(partition => partition.place))
        .toEqual(places.filter((_, index) => operand.alignedDigits[index] !== 0));
    expect(nextStart).toBe(value);
}

function expectExactArea(problem: DecimalMultiplicationProblem): void {
    expect(problem.kind).toBe('decimal-multiplication-model');
    expect(problem.base).toBe(10);
    expect(problem.operandScale).toBe(100);
    expect(problem.productScale).toBe(10000);
    expectOperand(problem.first);
    expectOperand(problem.second);
    const width = problem.first.valueInHundredths;
    const height = problem.second.valueInHundredths;
    expect(problem.product.valueInTenThousandths).toBe(width * height);
    expect(problem.areaGrid.widthInHundredths).toBe(width);
    expect(problem.areaGrid.heightInHundredths).toBe(height);
    expect(problem.areaGrid.cellAreaInTenThousandths).toBe(1);
    expect(problem.areaGrid.cellCount).toBe(width * height);
    expect(problem.areaGrid.regions.length)
        .toBe(problem.first.partitions.length * problem.second.partitions.length);
    const expectedCells = new Set<string>();
    let total = 0;
    problem.areaGrid.regions.forEach((region, index) => {
        const firstIndex = Math.floor(index / problem.second.partitions.length);
        const secondIndex = index % problem.second.partitions.length;
        const horizontal = problem.first.partitions[firstIndex];
        const vertical = problem.second.partitions[secondIndex];
        expect(region.firstPartitionIndex).toBe(firstIndex);
        expect(region.secondPartitionIndex).toBe(secondIndex);
        expect(region.columnStart).toBe(horizontal.startInHundredths);
        expect(region.rowStart).toBe(vertical.startInHundredths);
        expect(region.columns).toBe(horizontal.valueInHundredths);
        expect(region.rows).toBe(vertical.valueInHundredths);
        expect(region.cellCount).toBe(region.columns * region.rows);
        expect(region.productInTenThousandths).toBe(region.cellCount);
        total += region.cellCount;
        if (width * height <= 1440) {
            for (let row = region.rowStart; row < region.rowStart + region.rows; row++) {
                for (let column = region.columnStart;
                    column < region.columnStart + region.columns; column++) {
                    const cell = `${column},${row}`;
                    expect(expectedCells.has(cell)).toBe(false);
                    expectedCells.add(cell);
                }
            }
        }
    });
    expect(total).toBe(width * height);
    if (width * height <= 1440) expect(expectedCells.size).toBe(width * height);
    const fraction = String((width * height) % 10000).padStart(4, '0')
        .replace(/0+$/, '');
    expect(problem.product.canonicalNumeral).toBe(fraction === ''
        ? String(Math.floor(width * height / 10000))
        : `${Math.floor(width * height / 10000)}.${fraction}`);
    expect(problem).not.toHaveProperty('prompt');
    expect(problem).not.toHaveProperty('answerProse');
}

describe('createDecimalMultiplicationProblem', () => {
    it.each([
        [12, 3, '0.0036'],
        [120, 34, '0.408'],
        [5, 6, '0.003'],
        [103, 7, '0.0721'],
        [0, 7, '0'],
        [7, 0, '0'],
        [0, 0, '0'],
        [999, 999, '99.8001']
    ])('makes the exact area relation for %i × %i', (first, second, numeral) => {
        const data = createDecimalMultiplicationProblem(first, second)!;
        expectExactArea(data);
        expect(data.product.canonicalNumeral).toBe(numeral);
    });

    it('partitions 1.20 × 0.34 into four disjoint partial products', () => {
        const data = createDecimalMultiplicationProblem(120, 34)!;
        expect(data.first.partitions).toEqual([
            {place: 'ones', digit: 1, valueInHundredths: 100, startInHundredths: 0},
            {place: 'tenths', digit: 2, valueInHundredths: 20, startInHundredths: 100}
        ]);
        expect(data.second.partitions).toEqual([
            {place: 'tenths', digit: 3, valueInHundredths: 30, startInHundredths: 0},
            {place: 'hundredths', digit: 4, valueInHundredths: 4, startInHundredths: 30}
        ]);
        expect(data.areaGrid.regions.map(region => region.productInTenThousandths))
            .toEqual([3000, 400, 600, 80]);
    });

    it('retains the zero tenths placeholder in 1.03 × 0.07', () => {
        const data = createDecimalMultiplicationProblem(103, 7)!;
        expect(data.first.alignedDigits).toEqual([1, 0, 3]);
        expect(data.second.alignedDigits).toEqual([0, 0, 7]);
        expect(data.first.partitions.map(part => part.place)).toEqual(['ones', 'hundredths']);
        expect(data.product.valueInTenThousandths).toBe(721);
    });

    it('rejects invalid hundredth counts', () => {
        for (const value of [-1, 1000, 0.5, NaN, Infinity]) {
            expect(createDecimalMultiplicationProblem(value, 7)).toBeNull();
            expect(createDecimalMultiplicationProblem(7, value)).toBeNull();
        }
    });
});

describe('DecimalMultiplicationModelGenerator', () => {
    it('requires an empty configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow();
        expect(() => generator.generate({variant: 'unsupported'} as never)).toThrow();
    });

    it('samples bounded positive hundredths factors and four-place products across profiles', () => {
        const profiles = new Set<string>();
        for (let seed = 0; seed < 240; seed++) {
            setSeed(`decimal-multiplication-${seed}`);
            const data = generator.generate({})!.data;
            expectExactArea(data);
            const first = data.first.valueInHundredths;
            const second = data.second.valueInHundredths;
            expect(first).toBeGreaterThan(0);
            expect(first).toBeLessThanOrEqual(120);
            expect(second).toBeGreaterThan(0);
            expect(second).toBeLessThanOrEqual(12);
            expect(first % 10).not.toBe(0);
            expect(second % 10).not.toBe(0);
            expect(data.product.valueInTenThousandths % 10).not.toBe(0);
            expect(data.areaGrid.cellCount).toBeLessThanOrEqual(1440);
            if (first < 10) profiles.add('hundredths-by-hundredths');
            else if (first < 100 && second < 10) profiles.add('tenths-by-hundredths');
            else if (first < 100) profiles.add('two-part-axes');
            else if (first < 110) profiles.add('zero-placeholder');
            else profiles.add('three-part-axis');
        }
        expect(profiles).toEqual(new Set([
            'hundredths-by-hundredths',
            'tenths-by-hundredths',
            'two-part-axes',
            'zero-placeholder',
            'three-part-axis'
        ]));
    });

    it('replays one exact Cartesian decomposition with the same seed', () => {
        setSeed('decimal-multiplication-replay');
        const first = generator.generate({});
        setSeed('decimal-multiplication-replay');
        expect(generator.generate({})).toEqual(first);
    });
});
