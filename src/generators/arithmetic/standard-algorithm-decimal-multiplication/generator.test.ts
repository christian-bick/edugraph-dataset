import {describe, expect, it} from 'vitest';
import {GeneratorValidationError} from '../../../lib/errors.ts';
import {setSeed} from '../../../lib/random.ts';
import type {DecimalStandardMultiplicationProblem} from '../../../types/problems.ts';
import {buildDecimalStandardMultiplicationProblem, StandardAlgorithmDecimalMultiplicationGenerator} from './generator.ts';

const generator = new StandardAlgorithmDecimalMultiplicationGenerator();
const parsed = (numeral: string) => {
    const [whole, fractional = ''] = numeral.split('.');
    return {coefficient: BigInt(`${whole}${fractional}`), scale: fractional.length};
};

function assertProduct(data: DecimalStandardMultiplicationProblem): void {
    const first = parsed(data.multiplicand.numeral);
    const second = parsed(data.multiplier.numeral);
    const product = parsed(data.product.numeral);
    expect(product.coefficient).toBe(first.coefficient * second.coefficient);
    expect(product.scale).toBe(first.scale + second.scale);
    expect(data.unscaledProduct).toBe(data.product.coefficient);
    expect(data.multiplicandDigits.join('')).toBe(String(data.multiplicand.coefficient));
    expect(data.multiplierDigits.join('')).toBe(String(data.multiplier.coefficient));
    expect(data.partialRows).toHaveLength(data.multiplierDigits.length);
    data.partialRows.forEach((row, index) => {
        expect(row.shiftPlaces).toBe(index);
        expect(row.multiplierDigit).toBe(data.multiplierDigits.at(-index - 1));
        expect(BigInt(row.unshiftedProduct)).toBe(first.coefficient * BigInt(row.multiplierDigit));
        expect(BigInt(row.alignedProduct)).toBe(BigInt(row.unshiftedProduct) * 10n ** BigInt(index));
        expect(row.columns).toHaveLength(data.multiplicandDigits.length);
        row.columns.forEach((column, place) => {
            expect(column.placeIndex).toBe(place);
            expect(column.multiplicandDigit).toBe(data.multiplicandDigits.at(-place - 1));
            expect(column.carryIn).toBe(place === 0 ? 0 : row.columns[place - 1]!.carryOut);
            expect(column.workingValue).toBe(column.multiplicandDigit * row.multiplierDigit + column.carryIn);
            expect(column.resultDigit + 10 * column.carryOut).toBe(column.workingValue);
        });
        expect(row.leadingCarry).toBe(row.columns.at(-1)!.carryOut);
    });
    expect(data.partialRows.reduce((sum, row) => sum + BigInt(row.alignedProduct), 0n)).toBe(product.coefficient);
    expect(data.sumColumns).toHaveLength(String(data.unscaledProduct).length);
    data.sumColumns.forEach((column, place) => {
        expect(column.placeIndex).toBe(place);
        expect(column.addendDigits).toEqual(data.partialRows.map(row => Number(String(row.alignedProduct).at(-place - 1) ?? '0')));
        expect(column.carryIn).toBe(place === 0 ? 0 : data.sumColumns[place - 1]!.carryOut);
        expect(column.workingValue).toBe(column.addendDigits.reduce((sum, digit) => sum + digit, column.carryIn));
        expect(column.resultDigit + 10 * column.carryOut).toBe(column.workingValue);
    });
    expect(data.sumColumns.at(-1)!.carryOut).toBe(0);
    expect([...data.sumColumns].reverse().map(column => column.resultDigit).join('')).toBe(String(data.unscaledProduct));
    expect(data.decimalPlacement.coefficientDigits.join('')).toBe(String(data.unscaledProduct));
    expect(data.decimalPlacement.paddedDigits.join('')).toBe(data.product.numeral.replace('.', ''));
    expect(data.decimalPlacement.paddedDigits.length).toBeGreaterThanOrEqual(product.scale + 1);
    expect(data.decimalPlacement.decimalIndex).toBe(data.decimalPlacement.paddedDigits.length - product.scale);
    expect(data.decimalPlacement.totalScale).toBe(product.scale);
}

describe('exact standard decimal multiplication', () => {
    it.each([
        ['2.05', '0.304', '0.62320'], ['0.12', '0.10', '0.0120'],
        ['12.005', '0.008', '0.096040'], ['0.004', '0.025', '0.000100'],
        ['12.50', '0.00', '0.0000'], ['0.0', '12.50', '0.000'],
        ['99.99', '9.99', '998.9001'], ['120.0', '10.0', '1200.00'],
        ['0', '0', '0'], ['9007199254740991', '1', '9007199254740991']
    ])('retains exact supplied precision for %s × %s = %s', (first, second, expected) => {
        const data = buildDecimalStandardMultiplicationProblem(first, second);
        expect(data.product.numeral).toBe(expected);
        assertProduct(data);
    });

    it('retains internal/trailing zero coefficient rows and their full carry columns', () => {
        const data = buildDecimalStandardMultiplicationProblem('12.05', '1.020');
        expect(data.multiplierDigits).toEqual([1, 0, 2, 0]);
        expect(data.partialRows.map(row => row.multiplierDigit)).toEqual([0, 2, 0, 1]);
        expect(data.partialRows[0]!.columns.map(column => column.workingValue)).toEqual([0, 0, 0, 0]);
        assertProduct(data);
    });

    it('uses one sum column for zero, even with several shifted zero partial rows', () => {
        const data = buildDecimalStandardMultiplicationProblem('0.00', '12.50');
        expect(data.partialRows).toHaveLength(4);
        expect(data.sumColumns).toEqual([{placeIndex: 0, addendDigits: [0, 0, 0, 0], carryIn: 0,
            workingValue: 0, resultDigit: 0, carryOut: 0}]);
        expect(data.product.numeral).toBe('0.0000');
    });

    it.each([['01.0', '1'], ['-1', '1'], ['1e2', '1'], ['1.', '1'],
        ['9007199254740992', '1'], ['9007199254740991', '2'],
        ['0.000000000000001', '0.000000000000001']])('rejects invalid or unsafe %s × %s', (first, second) => {
        expect(() => buildDecimalStandardMultiplicationProblem(first, second)).toThrow(GeneratorValidationError);
    });
});

describe('standard decimal multiplication configuration', () => {
    it('rejects missing configuration and unsupported ranges', () => {
        expect(() => generator.generate({})).toThrow(GeneratorValidationError);
        for (const range of [null, 100000, {}, {min: 1, max: 100000}, {min: 0, max: 10000}]) {
            expect(() => generator.generate({range} as never)).toThrow(GeneratorValidationError);
        }
    });

    it('proves range and canonical-label invariants across both bounds and the no-bound sentinel', () => {
        const features = new Set<string>();
        for (const max of [100000, 1000000, Number.MAX_SAFE_INTEGER]) {
            const cap = max === Number.MAX_SAFE_INTEGER ? 999999 : max;
            for (let seed = 0; seed < 160; seed++) {
                setSeed(seed);
                const data = generator.generate({range: {min: 0, max}}).data;
                assertProduct(data);
                expect(Math.max(data.multiplicand.coefficient / 10 ** data.multiplicand.scale,
                    data.multiplier.coefficient / 10 ** data.multiplier.scale)).toBeGreaterThanOrEqual(10);
                expect(data.multiplicand.scale + data.multiplier.scale).toBeGreaterThan(0);
                for (const value of [data.multiplicand.coefficient, data.multiplier.coefficient, data.product.coefficient,
                    ...data.partialRows.flatMap(row => [row.unshiftedProduct, row.alignedProduct,
                        ...row.columns.flatMap(column => [column.workingValue, column.carryIn, column.carryOut])])]) {
                    expect(value).toBeGreaterThanOrEqual(0);
                    expect(value).toBeLessThanOrEqual(cap);
                }
                if (data.product.coefficient === 0) features.add('zero');
                if (data.product.scale >= 3 && data.product.coefficient % 10 ** data.product.scale !== 0) features.add('fine');
                if (data.partialRows.some(row => row.columns.some(column => column.carryOut > 0))) features.add('carry');
                if (/\d0\d/.test(data.multiplierDigits.join(''))) features.add('internal-zero');
            }
        }
        expect([...features].sort()).toEqual(['carry', 'fine', 'internal-zero', 'zero']);
    });

    it('replays deterministically and changes admissible magnitude with its genuine range', () => {
        let larger = false;
        for (let seed = 0; seed < 20; seed++) {
            setSeed(seed);
            const first = generator.generate({range: {min: 0, max: 100000}});
            setSeed(seed);
            expect(generator.generate({range: {min: 0, max: 100000}})).toEqual(first);
            expect(Object.keys(first)).toEqual(['data']);
            setSeed(seed);
            const second = generator.generate({range: {min: 0, max: 1000000}}).data;
            if (second.product.coefficient > 100000 || second.multiplicand.coefficient > 100000
                || second.multiplier.coefficient > 100000) larger = true;
        }
        expect(larger).toBe(true);
    });
});
