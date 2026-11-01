import {afterEach, describe, expect, it, vi} from 'vitest';
import {createCanonicalNumericRange, hasCanonicalRangeWitness} from '../../../lib/canonical-numeric-range.ts';
import * as rng from '../../../lib/random.ts';
import {exactDecimal} from '../standard-decimal-helpers.ts';
import {decimalMultiplicationSourceCap, STANDARD_DECIMAL_MULTIPLIERS, standardDecimalMultiplicationCases} from './domain.ts';
import {buildDecimalStandardMultiplicationProblem, StandardAlgorithmDecimalMultiplicationGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());
const uppers = [100, 120, 1000, 10000, 100000, 1000000];

describe('standard decimal multiplication coefficient intervals', () => {
    it('partitions all 10055172 former coefficient paths and retains each profile source law', () => {
        const intervals = new Map<string, [number, number][]>();
        let paths = 0;
        for (const upper of uppers) {
            const range = createCanonicalNumericRange(upper), cap = decimalMultiplicationSourceCap(upper);
            expect(cap).toBe(upper === 100000 || upper === 1000000 ? upper : 999999);
            for (const block of standardDecimalMultiplicationCases(range)) {
                const sourceMinimum = 10 * 10 ** block.firstScale;
                const choices = STANDARD_DECIMAL_MULTIPLIERS.filter(m => m * sourceMinimum <= cap);
                const sourceMaximum = block.secondCoefficient ? Math.floor(cap / block.secondCoefficient) : cap;
                expect(block.minimum).toBeGreaterThanOrEqual(sourceMinimum);
                expect(block.maximum).toBeLessThanOrEqual(sourceMaximum);
                expect(block.weight / (block.maximum - block.minimum + 1))
                    .toBeCloseTo(1 / 3 / choices.length / (sourceMaximum - sourceMinimum + 1), 14);
                const key = `${block.firstScale}:${block.secondCoefficient}`;
                intervals.set(key, [...intervals.get(key) ?? [], [block.minimum, block.maximum]]);
                paths += block.maximum - block.minimum + 1;
            }
        }
        let expectedPaths = 0;
        for (const scale of [1, 2, 3]) {
            const minimum = 10 * 10 ** scale;
            for (const m of STANDARD_DECIMAL_MULTIPLIERS.filter(m => m * minimum <= 1000000)) {
                const maximum = m ? Math.floor(1000000 / m) : 1000000;
                const pieces = intervals.get(`${scale}:${m}`)!;
                expect(pieces[0]![0]).toBe(minimum);
                expect(pieces[pieces.length - 1]![1]).toBe(maximum);
                for (let i = 1; i < pieces.length; i++) expect(pieces[i]![0]).toBe(pieces[i - 1]![1] + 1);
                expectedPaths += maximum - minimum + 1;
            }
        }
        expect(paths).toBe(expectedPaths);
        expect(paths).toBe(10055172);
    });

    it('proves maximum domination for every interval endpoint, precision and orientation', () => {
        let errors = 0, payloads = 0;
        for (const upper of uppers) {
            const range = createCanonicalNumericRange(upper);
            for (const block of standardDecimalMultiplicationCases(range)) for (const first of [block.minimum, block.maximum])
                for (const secondScale of [0, 1, 2, 3]) for (const swap of [false, true]) {
                    const a = exactDecimal(first, block.firstScale).numeral, b = exactDecimal(block.secondCoefficient, secondScale).numeral;
                    const data = buildDecimalStandardMultiplicationProblem(swap ? b : a, swap ? a : b);
                    const quantities = [data.multiplicand.coefficient / 10 ** data.multiplicand.scale,
                        data.multiplier.coefficient / 10 ** data.multiplier.scale, data.product.coefficient / 10 ** data.product.scale,
                        data.multiplicand.coefficient, data.multiplier.coefficient, data.unscaledProduct,
                        data.multiplicand.scale, data.multiplier.scale, data.decimalPlacement.totalScale,
                        ...data.partialRows.flatMap(row => [row.shiftPlaces, row.unshiftedProduct, row.alignedProduct,
                            ...row.columns.flatMap(column => [column.multiplicandDigit, row.multiplierDigit, column.workingValue,
                                column.carryIn, column.carryOut, column.resultDigit])]),
                        ...data.sumColumns.flatMap(column => [column.workingValue, ...column.addendDigits,
                            column.carryIn, column.carryOut, column.resultDigit])];
                    if (Math.max(...quantities) !== first * Math.max(1, block.secondCoefficient)
                        || !hasCanonicalRangeWitness(quantities, range)) errors++;
                    payloads++;
                }
        }
        expect(errors).toBe(0);
        expect(payloads).toBe(1712);
    });

    it('samples both endpoints of every interval without escaping the declared profile', () => {
        const draw = vi.spyOn(rng, 'random');
        const generator = new StandardAlgorithmDecimalMultiplicationGenerator();
        for (const upper of uppers) {
            const range = createCanonicalNumericRange(upper), cases = standardDecimalMultiplicationCases(range);
            const total = cases.reduce((sum, entry) => sum + entry.weight, 0);
            let preceding = 0;
            for (const block of cases) {
                for (const end of [0, 1]) {
                    const inputs = [(preceding + block.weight / 2) / total, end ? 1 - 1e-12 : 0, end ? 1 - 1e-12 : 0, 0.1];
                    draw.mockReset().mockImplementation(() => inputs.shift()!);
                    const data = generator.generate({range}).data;
                    expect(data.multiplicand.coefficient).toBe(end ? block.maximum : block.minimum);
                    expect(data.multiplicand.scale).toBe(block.firstScale);
                    expect(data.multiplier.coefficient).toBe(block.secondCoefficient);
                    expect(data.multiplier.scale).toBe(end ? 3 : 0);
                    expect(inputs).toEqual([]);
                }
                preceding += block.weight;
            }
        }
    });

    it('rejects malformed and unsupported bounds before drawing randomness', () => {
        const draw = vi.spyOn(rng, 'random');
        for (const range of [undefined, createCanonicalNumericRange(20), createCanonicalNumericRange(100, 5),
            {...createCanonicalNumericRange(100), maximumAbove: 0}, {...createCanonicalNumericRange(100), minimumBelow: 10}])
            expect(() => new StandardAlgorithmDecimalMultiplicationGenerator().generate({range: range as never})).toThrow();
        expect(draw).not.toHaveBeenCalled();
    });
});
