import {afterEach, describe, expect, it, vi} from 'vitest';
import {setSeed} from '../../../lib/random.ts';
import * as rng from '../../../lib/random.ts';
import {PlaceValueScalingProblem} from '../../../types/problems.ts';
import {PlaceValueScalingGenerator} from './generator.ts';

afterEach(() => vi.restoreAllMocks());

const PLACE_NAMES = [
    'ones',
    'tens',
    'hundreds',
    'thousands',
    'ten-thousands',
    'hundred-thousands'
] as const;

const expectValidScaling = (problem: PlaceValueScalingProblem): void => {
    expect(problem.task).toBe('adjacent-place-scaling');
    expect(problem.number).toBeGreaterThanOrEqual(100000);
    expect(problem.number).toBeLessThan(1000000);
    expect(problem.digits).toHaveLength(6);
    expect(problem.digits.reduce((value, digit) => value * 10 + digit, 0))
        .toBe(problem.number);
    expect(problem.repeatedDigit).toBeGreaterThanOrEqual(1);
    expect(problem.repeatedDigit).toBeLessThanOrEqual(9);
    expect(problem.digits.filter(digit => digit === problem.repeatedDigit)).toHaveLength(2);

    expect(problem.rightPlace.digitIndex).toBe(problem.leftPlace.digitIndex + 1);
    expect(problem.leftPlace.exponent).toBe(problem.rightPlace.exponent + 1);
    expect(problem.leftPlace.name).toBe(PLACE_NAMES[problem.leftPlace.exponent]);
    expect(problem.rightPlace.name).toBe(PLACE_NAMES[problem.rightPlace.exponent]);
    expect(problem.digits[problem.leftPlace.digitIndex]).toBe(problem.repeatedDigit);
    expect(problem.digits[problem.rightPlace.digitIndex]).toBe(problem.repeatedDigit);
    expect(problem.leftPlace.value).toBe(
        problem.repeatedDigit * 10 ** problem.leftPlace.exponent
    );
    expect(problem.rightPlace.value).toBe(
        problem.repeatedDigit * 10 ** problem.rightPlace.exponent
    );
    expect(problem.leftPlace.value).toBe(problem.rightPlace.value * 10);
    expect(problem.scaleFactor).toBe(10);
};

describe('PlaceValueScalingGenerator', () => {
    const generator = new PlaceValueScalingGenerator();

    it('strictly requires a configuration object', () => {
        expect(() => generator.generate(null as never)).toThrow();
    });

    it('constructs exact adjacent place-value scaling evidence below one million', () => {
        const exponents = new Set<number>();
        const repeatedDigits = new Set<number>();

        for (let seed = 0; seed < 300; seed++) {
            setSeed(seed);
            const hasZeroCoefficient = seed % 2 === 0;
            const problem = generator.generate({hasZeroCoefficient, coefficientMinimum: 1}).data;
            expectValidScaling(problem);
            expect(problem.digits.includes(0)).toBe(hasZeroCoefficient);
            exponents.add(problem.rightPlace.exponent);
            repeatedDigits.add(problem.repeatedDigit);
        }

        expect(exponents).toEqual(new Set([0, 1, 2, 3, 4]));
        expect(repeatedDigits).toEqual(new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
    });

    it('is deterministic under the project RNG', () => {
        setSeed('place-value-scaling');
        const first = generator.generate({hasZeroCoefficient: true, coefficientMinimum: 1});
        setSeed('place-value-scaling');
        const second = generator.generate({hasZeroCoefficient: true, coefficientMinimum: 1});

        expect(second).toEqual(first);
    });

    it('rejects missing and malformed coefficient profiles', () => {
        expect(() => generator.generate({} as never)).toThrow();
        expect(() => generator.generate({hasZeroCoefficient: 'yes'} as never)).toThrow();
        expect(() => generator.generate({hasZeroCoefficient: true, coefficientMinimum: 5})).toThrow();
        expect(() => generator.generate({hasZeroCoefficient: false, coefficientMinimum: 3} as never)).toThrow();
    });

    it('preserves every zero pattern, repeated digit and adjacent position', () => {
        const random = vi.spyOn(rng, 'random');
        const middle = (weights: number[], index: number) =>
            (weights.slice(0, index).reduce((sum, value) => sum + value, 0) + weights[index]! / 2)
                / weights.reduce((sum, value) => sum + value, 0);
        for (let repeatedDigit = 1; repeatedDigit <= 9; repeatedDigit++) {
            for (let left = 0; left < 5; left++) {
                const otherPlaces = [1, 2, 3, 4, 5].filter(index => index !== left && index !== left + 1);
                for (let mask = 0; mask < 2 ** otherPlaces.length; mask++) {
                    const zeroPlaces = otherPlaces.filter((_, index) => mask & (1 << index));
                    const hasZeroCoefficient = mask !== 0;
                    const positionWeights = [0, 1, 2, 3, 4].map(index => {
                        const absence = (8 / 9) ** (index === 0 ? 4 : 3);
                        return hasZeroCoefficient ? 1 - absence : absence;
                    });
                    const firstZero = zeroPlaces[0] ?? -1;
                    const coefficientMinimum = !hasZeroCoefficient && repeatedDigit >= 5 ? 5 : 1;
                    const repeatDraw = hasZeroCoefficient ? (repeatedDigit - 0.5) / 9 : coefficientMinimum === 5
                        ? (repeatedDigit - 4.5) / 5 : middle([16, 16, 16, 16, 15, 15, 15, 15, 15], repeatedDigit - 1);
                    const choices = [repeatDraw, middle(positionWeights, left)];
                    if (hasZeroCoefficient) choices.push(middle(otherPlaces.map((_, index) =>
                        8 ** index * 9 ** (otherPlaces.length - index - 1)), otherPlaces.indexOf(firstZero)));
                    for (let index = 0; index < 6; index++) {
                        if (index === left || index === left + 1 || index === firstZero) continue;
                        const positive = index === 0 || !hasZeroCoefficient || index < firstZero;
                        // Exercise a later zero or the largest positive choice in its original domain.
                        choices.push(zeroPlaces.includes(index) ? 0.5 / 9 : 1 - Number.EPSILON);
                        expect(positive && zeroPlaces.includes(index)).toBe(false);
                    }
                    random.mockReset().mockImplementation(() => choices.shift()!);
                    const problem = generator.generate({hasZeroCoefficient, coefficientMinimum}).data;
                    expectValidScaling(problem);
                    expect(problem.leftPlace.digitIndex).toBe(left);
                    expect(problem.repeatedDigit).toBe(repeatedDigit);
                    expect(problem.digits.flatMap((digit, index) => digit === 0 ? [index] : [])).toEqual(zeroPlaces);
                    expect(choices).toHaveLength(0);
                }
            }
        }
    });

    it('retains each original coefficient vector in exactly one strongest-floor profile', () => {
        const counts = {zero: 0, low: 0, high: 0};
        for (let repeated = 1; repeated <= 9; repeated++) for (let left = 0; left < 5; left++) {
            const free = [0, 1, 2, 3, 4, 5].filter(index => index !== left && index !== left + 1);
            for (let code = 0; code < 9 ** 4; code++) {
                const digits = [repeated, repeated, repeated, repeated, repeated, repeated];
                let rest = code;
                for (const index of free) {
                    const choice = rest % 9;
                    rest = Math.floor(rest / 9);
                    digits[index] = choice >= repeated ? choice + 1 : choice;
                }
                if (digits[0] === 0) continue;
                counts[digits.includes(0) ? 'zero' : Math.min(...digits) < 5 ? 'low' : 'high']++;
            }
        }
        expect(counts).toEqual({zero: 84681, low: 177920, high: 6400});
    });

    it('constructs every first-low position without rejection and honors the exact random endpoints', () => {
        const draw = vi.spyOn(rng, 'random');
        const weights = [16, 16, 16, 16, 15, 15, 15, 15, 15];
        const midpoint = (values: number[], index: number) => (values.slice(0, index).reduce((a, b) => a + b, 0)
            + values[index]! / 2) / values.reduce((a, b) => a + b, 0);
        for (let repeated = 5; repeated <= 9; repeated++) for (let left = 0; left < 5; left++) {
            const position = [0, 1, 2, 3, 4].map(i => (8 / 9) ** (i === 0 ? 4 : 3));
            const free = [0, 1, 2, 3, 4, 5].filter(i => i !== left && i !== left + 1);
            for (let low = 0; low < 4; low++) {
                const inputs = [midpoint(weights, repeated - 1), midpoint(position, left),
                    midpoint([2048, 1024, 512, 256], low), 0, 0, 0, 0];
                draw.mockReset().mockImplementation(() => inputs.shift()!);
                const data = generator.generate({hasZeroCoefficient: false, coefficientMinimum: 1}).data;
                expect(data.repeatedDigit).toBe(repeated);
                expect(data.leftPlace.digitIndex).toBe(left);
                expect(data.digits[free[low]!]).toBe(1);
                expect(data.digits.filter((_, i) => free.slice(0, low).includes(i)).every(d => d >= 5)).toBe(true);
                expect(inputs).toEqual([]);
            }
        }
        for (const config of [{hasZeroCoefficient: true, coefficientMinimum: 1},
            {hasZeroCoefficient: false, coefficientMinimum: 1}, {hasZeroCoefficient: false, coefficientMinimum: 5}] as const) {
            for (const endpoint of [0, (2 ** 32 - 1) / 2 ** 32]) {
                draw.mockReset().mockReturnValue(endpoint);
                const data = generator.generate(config).data;
                expectValidScaling(data);
                expect(data.digits.includes(0)).toBe(config.hasZeroCoefficient);
                expect(Math.min(...data.digits) >= 5).toBe(config.coefficientMinimum === 5);
            }
        }
    });
});
