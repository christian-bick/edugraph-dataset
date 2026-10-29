import {Area, Scope} from 'edugraph-ts';
import {afterEach, describe, expect, it, vi} from 'vitest';
import * as rng from '../../../lib/random.ts';
import {extractConfig} from '../../../lib/utils.ts';
import {ArithmeticOpsPairsGenerator} from './generator.ts';
import {ArithmeticOpsPairsGeneratorSchema} from './spec.ts';
import {boundedOperandWidthRows, sampleBoundedOperandWidthPair} from './width-sampling.ts';

afterEach(() => vi.restoreAllMocks());
const cases = [
    ['addition', 100], ['subtraction', 100], ['multiplication', 100], ['division', 100],
    ['addition', 1000], ['subtraction', 1000]
] as const;

describe.each(cases)('bounded %s within %i', (operation, bound) => {
    it('partitions every original pair with its original probability', () => {
        const expected = Array.from({length: 5}, () => ({count: 0, mass: 0}));
        const additive = operation === 'addition' || operation === 'subtraction';
        const firstCount = additive ? bound - 1 : bound;
        for (let first = 1; first <= firstCount; first++) {
            const secondCount = additive ? bound - first : Math.floor(bound / first);
            for (let second = 1; second <= secondCount; second++) {
                const largest = operation === 'subtraction' ? first + second
                    : operation === 'division' ? first * second : Math.max(first, second);
                const digits = String(largest).length;
                expected[digits]!.count++;
                expected[digits]!.mass += 1 / firstCount / secondCount;
            }
        }
        for (let digits = 1; digits <= 4; digits++) {
            const rows = boundedOperandWidthRows(operation, digits, bound);
            expect(rows.reduce((sum, row) => sum + row.high - row.low + 1, 0)).toBe(expected[digits]!.count);
            expect(rows.reduce((sum, row) => sum + row.weight, 0)).toBeCloseTo(expected[digits]!.mass, 10);
            const total = rows.reduce((sum, row) => sum + row.weight, 0);
            let before = 0;
            const random = vi.spyOn(rng, 'random');
            for (const row of rows) {
                for (const secondDraw of [0, 1 - Number.EPSILON]) {
                    random.mockReturnValueOnce((before + row.weight / 2) / total).mockReturnValueOnce(secondDraw);
                    const pair = sampleBoundedOperandWidthPair(operation, digits, bound)!;
                    expect(String(Math.max(...pair))).toHaveLength(digits);
                    const second = secondDraw === 0 ? row.low : row.high;
                    expect(pair).toEqual(operation === 'subtraction' ? [row.first + second, row.first]
                        : operation === 'division' ? [row.first * second, row.first] : [row.first, second]);
                }
                before += row.weight;
            }
            if (!rows.length) expect(sampleBoundedOperandWidthPair(operation, digits, bound)).toBeNull();
            random.mockRestore();
        }
        expect(expected.reduce((sum, item) => sum + item.mass, 0)).toBeCloseTo(1, 10);
    });

    it('resolves truthful explicit widths through direct generation', () => {
        const area = {addition: Area.Addition, subtraction: Area.Subtraction,
            multiplication: Area.Multiplication, division: Area.Division}[operation];
        const boundLabel = bound === 100 ? Scope.NumbersSmaller100 : Scope.NumbersSmaller1000;
        const labels = [Scope.SingleDigitLargestOperand, Scope.TwoDigitLargestOperand,
            Scope.ThreeDigitLargestOperand, Scope.FourDigitLargestOperand];
        for (let digits = 1; digits <= 4; digits++) {
            if (!boundedOperandWidthRows(operation, digits, bound).length) continue;
            for (let seed = 0; seed < 20; seed++) {
                rng.setSeed(seed);
                const resolved = extractConfig(ArithmeticOpsPairsGeneratorSchema,
                    [area, boundLabel, labels[digits - 1]!, Scope.NumbersWithoutNegatives, Scope.NumbersWithoutZero]);
                expect(resolved.config.largestOperandDigits).toBe(digits);
                const data = new ArithmeticOpsPairsGenerator().generate(resolved.config)!.data;
                expect(String(Math.max(data.num1, data.num2))).toHaveLength(digits);
                expect(data.num1).toBeGreaterThan(0);
                expect(data.num2).toBeGreaterThan(0);
                expect(data.answer).toBeGreaterThan(0);
                expect(Math.max(data.num1, data.num2, data.answer)).toBeLessThanOrEqual(bound);
            }
        }
    });
});
