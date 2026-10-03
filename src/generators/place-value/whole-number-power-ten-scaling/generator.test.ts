import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {
    WholeNumberPowerTenScalingProblem,
    WholePowerTenScaleStep
} from '../../../types/problems.ts';
import {WholeNumberPowerTenScalingGenerator} from './generator.ts';

const generator = new WholeNumberPowerTenScalingGenerator();

function checkStep(step: WholePowerTenScaleStep): void {
    const {original, power, product, placeShifts, zeroPattern} = step;
    expect(power.base).toBe(10);
    expect(power.value).toBe(10 ** power.exponent);
    expect(power.repeatedFactors).toEqual(Array(power.exponent).fill(10));
    expect(product).toBe(original * power.value);
    expect(Number.isSafeInteger(product)).toBe(true);
    expect(placeShifts).toHaveLength(String(original).length);
    expect(placeShifts.reduce((sum, shift) => sum + shift.originalContribution, 0)).toBe(original);
    expect(placeShifts.reduce((sum, shift) => sum + shift.productContribution, 0)).toBe(product);
    placeShifts.forEach((shift, index) => {
        expect(shift.digitIndex).toBe(index);
        expect(shift.digit).toBe(Number(String(original)[index]));
        expect(shift.originalPlaceExponent).toBe(placeShifts.length - index - 1);
        expect(shift.productPlaceExponent).toBe(shift.originalPlaceExponent + power.exponent);
        expect(shift.originalContribution).toBe(shift.digit * 10 ** shift.originalPlaceExponent);
        expect(shift.productContribution).toBe(shift.originalContribution * power.value);
    });
    if (original === 0) {
        expect(zeroPattern).toEqual({
            kind: 'zero',
            originalTrailingZeros: null,
            introducedTrailingZeros: 0,
            productTrailingZeros: null
        });
    } else {
        const countTrailingZeros = (value: number): number => String(value).match(/0*$/)?.[0].length ?? 0;
        expect(zeroPattern).toEqual({
            kind: 'positive',
            originalTrailingZeros: countTrailingZeros(original),
            introducedTrailingZeros: power.exponent,
            productTrailingZeros: countTrailingZeros(product)
        });
    }
}

function checkSeries(data: WholeNumberPowerTenScalingProblem): void {
    expect(data.kind).toBe('whole-number-power-ten-scaling');
    const originals = data.primarySeries.map(step => step.original);
    expect(new Set(originals).size).toBe(1);
    expect(originals[0]).toBeGreaterThanOrEqual(11);
    expect(originals[0]).toBeLessThanOrEqual(99);
    expect(originals[0]! % 10).not.toBe(0);
    expect(data.primarySeries.map(step => step.power.exponent)).toEqual([0, 1, 2]);
    expect(data.primarySeries.map(step => step.product)).toEqual([
        originals[0], originals[0]! * 10, originals[0]! * 100
    ]);
    expect(data.primarySeries.map(step => step.zeroPattern)).toEqual([
        {kind: 'positive', originalTrailingZeros: 0, introducedTrailingZeros: 0, productTrailingZeros: 0},
        {kind: 'positive', originalTrailingZeros: 0, introducedTrailingZeros: 1, productTrailingZeros: 1},
        {kind: 'positive', originalTrailingZeros: 0, introducedTrailingZeros: 2, productTrailingZeros: 2}
    ]);
    expect(data.existingZeroWitness.original).toBe(originals[0]! * 10);
    expect(data.existingZeroWitness.power.exponent).toBe(1);
    expect(data.existingZeroWitness.product).toBe(data.primarySeries[2].product);
    expect(data.existingZeroWitness.zeroPattern).toEqual({
        kind: 'positive', originalTrailingZeros: 1, introducedTrailingZeros: 1, productTrailingZeros: 2
    });
    expect(data.zeroWitness.original).toBe(0);
    expect(data.zeroWitness.power.exponent).toBe(2);
    for (const step of [...data.primarySeries, data.existingZeroWitness, data.zeroWitness]) {
        checkStep(step);
    }
    expect(data).not.toHaveProperty('prompt');
    expect(data).not.toHaveProperty('explanation');
}

describe('WholeNumberPowerTenScalingGenerator', () => {
    it('rejects a missing configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow();
    });

    it('produces exact zero and place-value evidence for many seeded originals', () => {
        const originals = new Set<number>();
        for (let seed = 0; seed < 100; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;
            checkSeries(data);
            originals.add(data.primarySeries[0].original);
        }
        expect(originals.size).toBeGreaterThan(10);
    });

    it('replays identically with the same seed', () => {
        setSeed('whole-power-ten-scaling');
        const first = generator.generate({});
        setSeed('whole-power-ten-scaling');
        expect(generator.generate({})).toEqual(first);
    });
});
