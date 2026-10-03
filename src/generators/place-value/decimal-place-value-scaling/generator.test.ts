import {describe, expect, it} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import type {DecimalAdjacentPlaceScalingProblem} from '../../../types/problems.ts';
import {DecimalPlaceValueScalingGenerator} from './generator.ts';

const generator = new DecimalPlaceValueScalingGenerator();
const names = ['hundreds', 'tens', 'ones', 'tenths', 'hundredths', 'thousandths'] as const;
const exponents = [2, 1, 0, -1, -2, -3] as const;
const units = [100000, 10000, 1000, 100, 10, 1] as const;

function checkExactScaling(data: DecimalAdjacentPlaceScalingProblem): void {
    expect(data.kind).toBe('decimal-adjacent-place-scaling');
    expect(data.digits).toHaveLength(6);
    expect(data.repeatedDigit).toBeGreaterThanOrEqual(1);
    expect(data.repeatedDigit).toBeLessThanOrEqual(9);
    expect(data.digits.filter(digit => digit === data.repeatedDigit)).toHaveLength(2);

    data.digits.forEach(digit => {
        expect(Number.isInteger(digit)).toBe(true);
        expect(digit).toBeGreaterThanOrEqual(0);
        expect(digit).toBeLessThanOrEqual(9);
    });
    expect(data.numberInThousandths).toBe(data.digits.reduce((sum, digit, index) =>
        sum + digit * units[index]!, 0));
    expect(Number.isSafeInteger(data.numberInThousandths)).toBe(true);

    const {higherPlace, lowerPlace} = data;
    expect(lowerPlace.digitIndex).toBe(higherPlace.digitIndex + 1);
    expect(higherPlace.exponent).toBe(lowerPlace.exponent + 1);
    for (const selected of [higherPlace, lowerPlace]) {
        expect(selected.name).toBe(names[selected.digitIndex]);
        expect(selected.exponent).toBe(exponents[selected.digitIndex]);
        expect(selected.unitInThousandths).toBe(units[selected.digitIndex]);
        expect(data.digits[selected.digitIndex]).toBe(data.repeatedDigit);
        expect(selected.digitValueInThousandths).toBe(data.repeatedDigit * selected.unitInThousandths);
    }
    expect(higherPlace.digitValueInThousandths).toBe(lowerPlace.digitValueInThousandths * 10);
    expect(lowerPlace.digitValueInThousandths).toBe(higherPlace.digitValueInThousandths / 10);
    expect(data.scale).toEqual({factor: 10, reciprocalNumerator: 1, reciprocalDenominator: 10});
    expect(data).not.toHaveProperty('prompt');
    expect(data).not.toHaveProperty('blankPlace');
    expect(data).not.toHaveProperty('explanation');
}

describe('DecimalPlaceValueScalingGenerator', () => {
    it('requires a configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow();
    });

    it('constructs exact adjacent whole, cross-units, and fractional scaling', () => {
        const higherIndices = new Set<number>();
        const repeatedDigits = new Set<number>();
        const domains = new Set<string>();
        for (let seed = 0; seed < 300; seed++) {
            setSeed(seed);
            const data = generator.generate({}).data;
            checkExactScaling(data);
            higherIndices.add(data.higherPlace.digitIndex);
            repeatedDigits.add(data.repeatedDigit);
            domains.add(data.higherPlace.digitIndex < 2 ? 'whole'
                : data.higherPlace.digitIndex === 2 ? 'cross-units' : 'fractional');
            if (data.higherPlace.digitIndex < 2) {
                expect(data.digits.slice(3)).toEqual([0, 0, 0]);
                expect(data.numberInThousandths % 1000).toBe(0);
            } else {
                expect(data.numberInThousandths % 1000).not.toBe(0);
            }
        }
        expect(higherIndices).toEqual(new Set([0, 1, 2, 3, 4]));
        expect(repeatedDigits).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
        expect(domains).toEqual(new Set(['whole', 'cross-units', 'fractional']));
    });

    it('replays the same exact chart under the same seed', () => {
        setSeed('decimal-adjacent-place-scaling');
        const first = generator.generate({});
        setSeed('decimal-adjacent-place-scaling');
        expect(generator.generate({})).toEqual(first);
    });
});
