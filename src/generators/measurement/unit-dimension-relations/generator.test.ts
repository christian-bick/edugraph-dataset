import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {DimensionUnitPowers, DimensionUnitSymbol, RatioRational} from '../../../types/problems.ts';
import {greatestCommonDivisor} from '../../ratio/helpers.ts';
import {UnitDimensionRelationsGenerator} from './generator.ts';

const generator = new UnitDimensionRelationsGenerator();
const symbols: DimensionUnitSymbol[] = ['m', 's', 'kg'];
const unitSignature = (units: DimensionUnitPowers) => `${units.m},${units.s},${units.kg}`;
const exactPositive = (value: RatioRational) => {
    expect(Number.isSafeInteger(value.numerator)).toBe(true);
    expect(value.numerator).toBeGreaterThan(0);
    expect(Number.isSafeInteger(value.denominator)).toBe(true);
    expect(value.denominator).toBeGreaterThan(0);
    expect(greatestCommonDivisor(value.numerator, value.denominator)).toBe(1);
};

describe('UnitDimensionRelationsGenerator', () => {
    it('rejects absent and invalid operations rather than choosing a fallback', () => {
        for (const config of [null, {}, {operation: null}, {operation: ''}, {operation: 'addition'}, {operation: []}]) {
            expect(() => generator.generate(config as never)).toThrow();
        }
    });

    it.each(['multiplication', 'division'] as const)('provides exact values, composed factors and complete cancellation for %s', operation => {
        const cases = new Set<string>();
        const results = new Set<string>();
        let fractionalOperands = 0;
        let withCancellation = 0;
        let withoutCancellation = 0;
        let repeatedCancellation = 0;
        for (let seed = 0; seed < 160; seed++) {
            setSeed(seed);
            const stub = generator.generate({operation});
            expect(Object.keys(stub)).toEqual(['data']);
            const {data} = stub;
            expect(data.kind).toBe('unit-dimension-relation');
            expect(data.operation).toBe(operation);
            const {left, right, result, unitFactors, cancellations} = data;
            for (const quantity of [left, right, result]) {
                exactPositive(quantity.value);
                expect(quantity.dimensions).toEqual({length: quantity.units.m, time: quantity.units.s, mass: quantity.units.kg});
            }
            if (operation === 'multiplication') {
                expect(result.value.numerator * left.value.denominator * right.value.denominator)
                    .toBe(result.value.denominator * left.value.numerator * right.value.numerator);
            } else {
                expect(result.value.numerator * left.value.denominator * right.value.numerator)
                    .toBe(result.value.denominator * left.value.numerator * right.value.denominator);
            }
            const numeratorIndices = cancellations.map(pair => pair.numeratorIndex);
            const denominatorIndices = cancellations.map(pair => pair.denominatorIndex);
            expect(new Set(numeratorIndices).size).toBe(cancellations.length);
            expect(new Set(denominatorIndices).size).toBe(cancellations.length);
            for (const pair of cancellations) {
                expect(pair.numeratorIndex).toBeGreaterThanOrEqual(0);
                expect(pair.numeratorIndex).toBeLessThan(unitFactors.numerator.length);
                expect(pair.denominatorIndex).toBeGreaterThanOrEqual(0);
                expect(pair.denominatorIndex).toBeLessThan(unitFactors.denominator.length);
                expect(unitFactors.numerator[pair.numeratorIndex]).toBe(unitFactors.denominator[pair.denominatorIndex]);
            }
            for (const symbol of symbols) {
                const numeratorCount = unitFactors.numerator.filter(unit => unit === symbol).length;
                const denominatorCount = unitFactors.denominator.filter(unit => unit === symbol).length;
                const rightPower = (operation === 'multiplication' ? 1 : -1) * right.units[symbol];
                expect(numeratorCount).toBe(Math.max(0, left.units[symbol]) + Math.max(0, rightPower));
                expect(denominatorCount).toBe(Math.max(0, -left.units[symbol]) + Math.max(0, -rightPower));
                expect(result.units[symbol]).toBe(left.units[symbol] + rightPower);
                const cancelledCount = cancellations.filter(pair => unitFactors.numerator[pair.numeratorIndex] === symbol).length;
                expect(cancelledCount).toBe(Math.min(numeratorCount, denominatorCount));
                expect(numeratorCount - cancelledCount).toBe(Math.max(0, result.units[symbol]));
                expect(denominatorCount - cancelledCount).toBe(Math.max(0, -result.units[symbol]));
            }
            if (left.value.denominator > 1 || right.value.denominator > 1) fractionalOperands++;
            if (cancellations.length > 0) withCancellation++;
            else withoutCancellation++;
            if (cancellations.length > 1) repeatedCancellation++;
            cases.add(`${unitSignature(left.units)}|${unitSignature(right.units)}`);
            results.add(unitSignature(result.units));
            expect(Object.keys(data).sort()).toEqual(['cancellations', 'kind', 'left', 'operation', 'result', 'right', 'unitFactors']);
        }
        expect(fractionalOperands).toBeGreaterThan(50);
        expect(withCancellation).toBeGreaterThan(20);
        expect(withoutCancellation).toBeGreaterThan(20);
        expect(repeatedCancellation).toBeGreaterThan(10);
        expect(cases).toEqual(operation === 'multiplication'
            ? new Set(['1,0,0|1,0,0', '1,-1,0|0,1,0', '0,-1,1|0,1,0', '-3,0,1|3,0,0'])
            : new Set(['1,0,0|0,1,0', '2,0,0|1,0,0', '1,0,0|1,0,0', '1,-1,0|1,-1,0', '0,0,1|0,1,0', '0,0,1|-3,0,1']));
        expect(results).toContain(operation === 'multiplication' ? '2,0,0' : '0,0,0');
    });

    it('replays values and unit witnesses from the same seed', () => {
        setSeed(456);
        const expected = generator.generate({operation: 'division'});
        setSeed(456);
        expect(generator.generate({operation: 'division'})).toEqual(expected);
    });
});
