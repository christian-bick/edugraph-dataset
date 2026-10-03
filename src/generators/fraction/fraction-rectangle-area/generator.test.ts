import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {
    FractionRectangleAreaProblem,
    FractionRectangleAreaRational
} from '../../../types/problems.ts';
import {FractionRectangleAreaGenerator} from './generator.ts';
import type {FractionRectangleAreaGeneratorConfig} from './spec.ts';

const generator = new FractionRectangleAreaGenerator();
const justifications = ['fraction-side-product', 'square-tile-proof'] as const;

const sample = (areaJustification: typeof justifications[number], seed: string):
    FractionRectangleAreaProblem => {
    setSeed(seed);
    return generator.generate({areaJustification}).data;
};

const equalRationals = (left: FractionRectangleAreaRational,
    right: FractionRectangleAreaRational): boolean =>
    BigInt(left.numerator) * BigInt(right.denominator)
        === BigInt(right.numerator) * BigInt(left.denominator);

const greatestCommonDivisor = (a: number, b: number): number => {
    while (b !== 0) [a, b] = [b, a % b];
    return a;
};

describe('fraction-rectangle-area exact square grid', () => {
    it.each(justifications)('builds complete bounded rectangle math in %s', justification => {
        const seen = new Set<string>();
        for (let seed = 0; seed < 180; seed++) {
            const data = sample(justification, `${justification}-${seed}`);
            const {length, width} = data.outerRectangle;
            const grid = data.tileGrid;
            const L = grid.partitionDenominator;
            seen.add(JSON.stringify([length, width]));

            expect(data.kind).toBe('fraction-rectangle-area');
            expect(data.linearUnit).toBe('unit');
            expect(data.squareUnit).toBe('square-unit');
            for (const side of [length, width]) {
                expect(Number.isSafeInteger(side.numerator)).toBe(true);
                expect(Number.isSafeInteger(side.denominator)).toBe(true);
                expect(side.numerator).toBeGreaterThan(0);
                expect(side.denominator).toBeGreaterThanOrEqual(2);
                expect(side.numerator % side.denominator).not.toBe(0);
            }
            expect(equalRationals(length, width)).toBe(false);
            expect(L).toBe(length.denominator / greatestCommonDivisor(length.denominator,
                width.denominator) * width.denominator);
            expect(L).toBeLessThanOrEqual(12);
            expect(grid.columns).toBe(length.numerator * (L / length.denominator));
            expect(grid.rows).toBe(width.numerator * (L / width.denominator));
            expect(grid.columns).not.toBe(grid.rows);
            expect(grid.columns).toBeLessThanOrEqual(10);
            expect(grid.rows).toBeLessThanOrEqual(10);
            expect(grid.tileCount).toBe(grid.rows * grid.columns);
            expect(grid.tileCount).toBeLessThanOrEqual(64);
            expect(grid.squareTile.side).toEqual({numerator: 1, denominator: L});
            expect(grid.squareTile.areaSquareUnits)
                .toEqual({numerator: 1, denominator: L * L});
            expect(data.areaSquareUnits).toEqual({
                numerator: length.numerator * width.numerator,
                denominator: length.denominator * width.denominator
            });
            expect(grid.tiledAreaSquareUnits)
                .toEqual({numerator: grid.tileCount, denominator: L * L});
            expect(equalRationals(data.areaSquareUnits, grid.tiledAreaSquareUnits)).toBe(true);

            const expectedCells = Array.from({length: grid.rows}, (_, row) =>
                Array.from({length: grid.columns}, (_, column) => ({row, column}))).flat();
            expect(grid.cells).toEqual(expectedCells);
            expect(new Set(grid.cells.map(cell => `${cell.row},${cell.column}`)).size)
                .toBe(grid.tileCount);

            expect(data.tileProof !== undefined).toBe(justification === 'square-tile-proof');
            if (data.tileProof) {
                expect(data.tileProof.tileCount).toBe(grid.tileCount);
                expect(data.tileProof.tileAreaSquareUnits).toEqual(grid.squareTile.areaSquareUnits);
                expect(data.tileProof.oneRowAreaSquareUnits)
                    .toEqual({numerator: grid.columns, denominator: L * L});
                expect(data.tileProof.countedAreaSquareUnits).toEqual(grid.tiledAreaSquareUnits);
                expect(data.tileProof.sideProductAreaSquareUnits).toEqual(data.areaSquareUnits);
                expect(equalRationals({
                    numerator: grid.rows * data.tileProof.oneRowAreaSquareUnits.numerator,
                    denominator: data.tileProof.oneRowAreaSquareUnits.denominator
                }, data.tileProof.countedAreaSquareUnits)).toBe(true);
                expect(equalRationals(data.tileProof.countedAreaSquareUnits,
                    data.tileProof.sideProductAreaSquareUnits)).toBe(true);
            }
        }
        expect(seen.size).toBeGreaterThan(35);
    });

    it('covers unlike denominators and proper and improper fractional sides', () => {
        const samples = Array.from({length: 250}, (_, seed) =>
            sample('fraction-side-product', `side-diversity-${seed}`));
        expect(samples.some(data => data.outerRectangle.length.denominator
            !== data.outerRectangle.width.denominator)).toBe(true);
        expect(samples.some(data => data.outerRectangle.length.numerator
            < data.outerRectangle.length.denominator)).toBe(true);
        expect(samples.some(data => data.outerRectangle.length.numerator
            > data.outerRectangle.length.denominator)).toBe(true);
        expect(samples.some(data => data.tileGrid.partitionDenominator >= 6)).toBe(true);
    });

    it('replays exactly and rejects missing or invalid justifications', () => {
        for (const justification of justifications) {
            expect(sample(justification, `replay-${justification}`))
                .toEqual(sample(justification, `replay-${justification}`));
        }
        expect(() => generator.generate({} as FractionRectangleAreaGeneratorConfig))
            .toThrow(/Required field "areaJustification"/);
        expect(() => generator.generate({areaJustification: 'unknown'} as unknown as
            FractionRectangleAreaGeneratorConfig)).toThrow(/Unsupported area justification/);
    });
});
